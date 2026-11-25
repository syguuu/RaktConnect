
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

function Messages() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [sending, setSending] = useState(false)

  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  const token = sessionStorage.getItem('token')
  const user = JSON.parse(sessionStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    async function fetchConversations() {
      try {
        const response = await fetch(
          'http://localhost:5000/api/chat/conversations',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load conversations.')
        }

        setConversations(data.conversations || [])
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [token, navigate])

  useEffect(() => {
    if (!token) return

    const socket = io('http://localhost:5000', {
      auth: { token }
    })

    socketRef.current = socket

    socket.on('connect_error', (error) => {
      setErrorMessage(error.message || 'Chat connection failed.')
    })

    socket.on('receiveMessage', (message) => {
      setMessages(previous => {
        if (previous.some(item => item._id === message._id)) {
          return previous
        }

        return [...previous, message]
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function openConversation(conversation) {
    setSelectedConversation(conversation)
    setMessages([])
    setErrorMessage('')
    setMessagesLoading(true)

    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/${conversation.bloodRequestId}/${conversation.otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load messages.')
      }

      setMessages(data.messages || [])

      socketRef.current?.emit('joinRoom', {
        bloodRequestId: conversation.bloodRequestId,
        otherUserId: conversation.otherUserId
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setMessagesLoading(false)
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault()

    if (!newMessage.trim() || !selectedConversation || sending) {
      return
    }

    setSending(true)
    setErrorMessage('')

    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/${selectedConversation.bloodRequestId}/${selectedConversation.otherUserId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: newMessage })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send message.')
      }

      setMessages(previous => {
        if (previous.some(item => item._id === data.chatMessage._id)) {
          return previous
        }

        return [...previous, data.chatMessage]
      })

      setNewMessage('')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSending(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  const styles = {
    layout: {
      display: 'grid',
      gridTemplateColumns: 'minmax(240px, 0.85fr) 2fr',
      gap: '20px',
      minHeight: '560px'
    },
    panel: {
      background: 'white',
      border: '1px solid #eee',
      borderRadius: '12px',
      padding: '18px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    },
    muted: {
      color: '#777',
      fontSize: '13px'
    },
    button: {
      width: '100%',
      padding: '15px',
      marginTop: '12px',
      textAlign: 'left',
      border: '1px solid #eee',
      borderRadius: '9px',
      cursor: 'pointer',
      background: 'white'
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>RaktConnect</h1>

        <nav>
          <Link to={
            user.role === 'donor'
              ? '/donor-dashboard'
              : user.role === 'admin'
                ? '/admin-dashboard'
                : '/requester-dashboard'
          }>
            Dashboard
          </Link>

          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <h1>Messages</h1>
          <p>Private conversations related to accepted blood requests.</p>
        </section>

        {errorMessage && (
          <p style={{
            color: '#a71930',
            background: '#fff4f4',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            {errorMessage}
          </p>
        )}

        <div style={styles.layout} className="messages-layout">

          {/* CONVERSATION LIST */}
          <section style={styles.panel}>
            <h2 style={{ color: '#292929', marginBottom: '5px' }}>
              Conversations
            </h2>

            <p style={styles.muted}>
              Your chats with other members
            </p>

            {loading && <p>Loading conversations...</p>}

            {!loading && conversations.length === 0 && (
              <p style={{ marginTop: '20px', color: '#777' }}>
                No conversations yet.
              </p>
            )}

            {conversations.map(conversation => {
              const isSelected =
                selectedConversation?.bloodRequestId === conversation.bloodRequestId &&
                selectedConversation?.otherUserId === conversation.otherUserId

              return (
                <button
                  key={`${conversation.bloodRequestId}-${conversation.otherUserId}`}
                  onClick={() => openConversation(conversation)}
                  style={{
                    ...styles.button,
                    background: isSelected ? '#fff4f4' : 'white',
                    borderColor: isSelected ? '#a71930' : '#eee'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      minWidth: '40px',
                      borderRadius: '50%',
                      background: '#fff0f0',
                      color: '#a71930',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700'
                    }}>
                      {conversation.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div>
                      <strong style={{
                        display: 'block',
                        color: '#292929'
                      }}>
                        {conversation.otherUserName}
                      </strong>

                      <span style={{
                        color: '#777',
                        fontSize: '12px'
                      }}>
                        {conversation.bloodGroup} blood group
                      </span>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#555'
                    }}>
                      {conversation.patientName}
                    </span>

                    <span style={{
                      fontSize: '10px',
                      color: '#a71930',
                      background: '#fff0f0',
                      padding: '4px 8px',
                      borderRadius: '20px'
                    }}>
                      {user.role === 'donor' ? 'Requester' : 'Donor'}
                    </span>
                  </div>
                </button>
              )
            })}
          </section>

          {/* CHAT WINDOW */}
          <section style={{
            ...styles.panel,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '560px',
            minWidth: 0
          }}>
            {selectedConversation ? (
              <>
                <div style={{
                  borderBottom: '1px solid #eee',
                  paddingBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#fff0f0',
                    color: '#a71930',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: '700'
                  }}>
                    {selectedConversation.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  <div>
                    <h2 style={{
                      color: '#292929',
                      fontSize: '19px',
                      margin: 0
                    }}>
                      {selectedConversation.otherUserName}
                    </h2>

                    <p style={{
                      color: '#a71930',
                      fontSize: '12px',
                      marginTop: '4px'
                    }}>
                      {user.role === 'donor' ? 'Requester' : 'Donor'}
                      {' · '}
                      {selectedConversation.bloodGroup}
                    </p>
                  </div>
                </div>

                <div style={{
                  background: '#fff8f8',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '14px'
                }}>
                  <p style={{
                    color: '#292929',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    Request details
                  </p>

                  <p style={{
                    color: '#555',
                    fontSize: '13px',
                    marginTop: '5px'
                  }}>
                    Patient: {selectedConversation.patientName}
                  </p>

                  <p style={{
                    color: '#555',
                    fontSize: '13px',
                    marginTop: '3px'
                  }}>
                    Hospital: {selectedConversation.hospitalName}
                  </p>
                </div>

                {/* MESSAGES AREA */}
                <div
                  style={{
                    flex: 1,
                    minHeight: '280px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '18px 5px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr)',
                    gridAutoRows: 'max-content',
                    alignContent: 'start',
                    gap: '14px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {messagesLoading && (
                    <p style={{ color: '#777', textAlign: 'center' }}>
                      Loading messages...
                    </p>
                  )}

                  {!messagesLoading && messages.length === 0 && (
                    <p style={{
                      color: '#777',
                      textAlign: 'center',
                      marginTop: '50px'
                    }}>
                      No messages yet. Start the conversation!
                    </p>
                  )}

                  {messages.map((message, index) => {
                    const senderId =
                      message.sender?._id || message.sender

                      const isMine =
                      senderId?.toString() === (user._id || user.id)?.toString()

                    return (
                      <div
                        key={message._id || index}
                        style={{
                          display: 'flex',
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-start',
                          gridColumn: '1 / -1'
                        }}
                      >
                        <div style={{
                          display: 'block',
                          width: 'fit-content',
                          maxWidth: '75%',
                          minWidth: '40px',
                          padding: '11px 15px',
                          boxSizing: 'border-box',
                          borderRadius: isMine
                            ? '14px 14px 3px 14px'
                            : '14px 14px 14px 3px',
                          background: isMine ? '#a71930' : '#f1f1f1',
                          color: isMine ? 'white' : '#292929',
                          overflowWrap: 'anywhere'
                        }}>
                          <p style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {message.message}
                          </p>

                          <small style={{
                            display: 'block',
                            textAlign: 'right',
                            opacity: 0.75,
                            fontSize: '10px',
                            marginTop: '5px'
                          }}>
                            {new Date(message.createdAt || message.sentAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      </div>
                    )
                  })}

                  <div
                    ref={bottomRef}
                    style={{
                      height: '1px',
                      gridColumn: '1 / -1'
                    }}
                  />
                </div>

                {/* MESSAGE INPUT */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    borderTop: '1px solid #eee',
                    paddingTop: '15px'
                  }}
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Write your message..."
                    maxLength={2000}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      color: '#292929',
                      background: 'white'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    style={{
                      background: '#a71930',
                      color: 'white',
                      padding: '10px 18px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      opacity: sending || !newMessage.trim() ? 0.6 : 1
                    }}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{
                margin: 'auto',
                textAlign: 'center',
                padding: '25px'
              }}>
                <h2 style={{ color: '#292929' }}>
                  Select a conversation
                </h2>

                <p style={{
                  color: '#777',
                  marginTop: '8px',
                  fontSize: '14px'
                }}>
                  Choose someone from the conversation list to view your messages.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <style>{`
        @media (max-width: 700px) {
          .messages-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Messages
