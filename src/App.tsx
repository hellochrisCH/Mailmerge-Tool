import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  custom: string
  status: 'pending' | 'success' | 'error'
  logDetails?: string
  timestamp?: string
}

interface LogMessage {
  id: string
  timestamp: string
  message: string
  type: 'info' | 'success' | 'error'
}

interface CampaignRun {
  id: string
  timestamp: string
  subject: string
  isHtml: boolean
  sendMethod: 'simulated' | 'mailto' | 'smtp'
  stats: {
    total: number
    sent: number
    failed: number
  }
}

const DEFAULT_MEMBERS: Member[] = [
  { id: '1', first_name: 'Sophia', last_name: 'Martinez', email: 'sophia.m@starlightclub.com', role: 'President', custom: 'Joined 2024', status: 'pending' },
  { id: '2', first_name: 'Liam', last_name: 'Chen', email: 'liam.chen@starlightclub.com', role: 'Treasurer', custom: 'Joined 2023', status: 'pending' },
  { id: '3', first_name: 'Olivia', last_name: 'Rodriguez', email: 'olivia.r@starlightclub.com', role: 'Event Coordinator', custom: 'Joined 2025', status: 'pending' },
  { id: '4', first_name: 'Ethan', last_name: 'Taylor', email: 'ethan.t@starlightclub.com', role: 'Captain', custom: 'Joined 2022', status: 'pending' },
  { id: '5', first_name: 'Emma', last_name: 'Johnson', email: 'emma.j@starlightclub.com', role: 'General Member', custom: 'Joined 2024', status: 'pending' },
  { id: '6', first_name: 'Marcus', last_name: 'Vance', email: 'marcus.v@starlightclub.com', role: 'Coach', custom: 'Joined 2021', status: 'pending' }
]

function App() {
  // Tabs & Navigation
  const [activeTab, setActiveTab] = useState<'contacts' | 'template' | 'config'>('contacts')

  // Members List State - persistent via localStorage
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('mf_members')
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERS
  })
  
  const membersRef = useRef(members)
  useEffect(() => {
    membersRef.current = members
  }, [members])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [newMember, setNewMember] = useState({ first_name: '', last_name: '', email: '', role: 'General Member', custom: '' })
  
  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', role: '', custom: '' })

  // CSV Import State
  const [csvText, setCsvText] = useState('')
  const [csvError, setCsvError] = useState('')

  // Template State - persistent via localStorage
  const [subject, setSubject] = useState(() => {
    return localStorage.getItem('mf_subject') || 'Important Update for our {{role}}: Upcoming Starlight Club Event!'
  })
  const [body, setBody] = useState(() => {
    return localStorage.getItem('mf_body') || 
      `Dear {{first_name}} {{last_name}},\n\nWe are writing to you as the {{role}} of the Starlight Club. First off, thank you for your active participation!\n\nWe have a special members-only gathering scheduled for next Thursday at 7:00 PM. Since you are listed under "{{custom}}", your group will be assigned specialized access passes.\n\nPlease confirm your attendance by replying directly to this email.\n\nBest regards,\nClub Management`
  })
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isHtml, setIsHtml] = useState(() => {
    return localStorage.getItem('mf_ishtml') === 'true'
  })

  // Configuration State - persistent via localStorage
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('mf_sendername') || 'Starlight Club Management'
  })
  const [senderEmail, setSenderEmail] = useState(() => {
    return localStorage.getItem('mf_senderemail') || ''
  })
  const [sendMethod, setSendMethod] = useState<'simulated' | 'mailto' | 'smtp'>(() => {
    return (localStorage.getItem('mf_sendmethod') as 'simulated' | 'mailto' | 'smtp') || 'simulated'
  })
  const [delayMs, setDelayMs] = useState(() => {
    const saved = localStorage.getItem('mf_delayms')
    return saved ? parseInt(saved) : 1500
  })

  // SMTP Credentials State - persistent via localStorage
  const [smtpUser, setSmtpUser] = useState(() => {
    return localStorage.getItem('mf_smtpuser') || ''
  })
  const [smtpPass, setSmtpPass] = useState(() => {
    return localStorage.getItem('mf_smtppass') || ''
  })


  // Campaign History State - persistent via localStorage
  const [campaignHistory, setCampaignHistory] = useState<CampaignRun[]>(() => {
    const saved = localStorage.getItem('mf_campaign_history')
    return saved ? JSON.parse(saved) : []
  })
  
  const [backendStatus, setBackendStatus] = useState<'checking' | 'active' | 'offline'>('checking')

  // Campaign Sending State
  const [isSending, setIsSending] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [logs, setLogs] = useState<LogMessage[]>([])
  
  // Ref to hold current index for asynchronous intervals
  const sendTimerRef = useRef<any>(null)

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mf_members', JSON.stringify(members))
  }, [members])

  useEffect(() => {
    localStorage.setItem('mf_subject', subject)
  }, [subject])

  useEffect(() => {
    localStorage.setItem('mf_body', body)
  }, [body])

  useEffect(() => {
    localStorage.setItem('mf_ishtml', String(isHtml))
  }, [isHtml])

  useEffect(() => {
    localStorage.setItem('mf_sendername', senderName)
  }, [senderName])

  useEffect(() => {
    localStorage.setItem('mf_senderemail', senderEmail)
  }, [senderEmail])

  useEffect(() => {
    localStorage.setItem('mf_sendmethod', sendMethod)
  }, [sendMethod])

  useEffect(() => {
    localStorage.setItem('mf_delayms', String(delayMs))
  }, [delayMs])

  useEffect(() => {
    localStorage.setItem('mf_smtpuser', smtpUser)
  }, [smtpUser])

  useEffect(() => {
    localStorage.setItem('mf_smtppass', smtpPass)
  }, [smtpPass])



  useEffect(() => {
    localStorage.setItem('mf_campaign_history', JSON.stringify(campaignHistory))
  }, [campaignHistory])

  // Validate backend health status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();
        if (data.status === 'healthy') {
          setBackendStatus('active');
        } else {
          setBackendStatus('offline');
        }
      } catch {
        setBackendStatus('offline');
      }
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [members, searchQuery])

  // Count Statistics
  const stats = useMemo(() => {
    const total = members.length
    const sent = members.filter(m => m.status === 'success').length
    const failed = members.filter(m => m.status === 'error').length
    const pending = members.filter(m => m.status === 'pending').length
    return { total, sent, failed, pending }
  }, [members])

  // Generate unique log IDs
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }
    setLogs(prev => [newLog, ...prev])
  }

  // Placeholder parser
  const renderTemplate = (text: string, member: Member) => {
    if (!member) return text
    return text
      .replace(/{{first_name}}/g, member.first_name)
      .replace(/{{last_name}}/g, member.last_name)
      .replace(/{{email}}/g, member.email)
      .replace(/{{role}}/g, member.role)
      .replace(/{{custom}}/g, member.custom)
  }

  // Insert placeholder at textarea cursor
  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    
    const newText = before + `{{${placeholder}}}` + after
    setBody(newText)
    
    // Reset focus & cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + placeholder.length + 4, start + placeholder.length + 4)
    }, 0)
  }

  // Load a demo HTML template
  const loadHtmlSample = () => {
    setSubject('Wichtiges Update für unser(e) {{role}}: Nächstes Starlight Club Treffen!')
    setBody(`<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #24293d; border-radius: 12px; overflow: hidden; background-color: #12141c; color: #f3f4f6;">
  <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 30px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">Starlight Club</h1>
    <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Exklusives Mitglieder-Update</p>
  </div>
  <div style="padding: 30px; line-height: 1.6; font-size: 15px;">
    <h2 style="margin: 0 0 16px; font-size: 20px; color: #a78bfa; font-weight: 600;">Hallo {{first_name}} {{last_name}}!</h2>
    <p style="margin: 0 0 16px; color: #d1d5db;">wir schreiben dir in deiner Funktion als <strong style="color: #ffffff;">{{role}}</strong> des Starlight Clubs. Vielen Dank für dein Engagement!</p>
    <p style="margin: 0 0 16px; color: #d1d5db;">Am nächsten Donnerstag um 19:00 Uhr findet unser exklusives Treffen statt. Da du der Gruppe <em style="color: #ec4899;">"{{custom}}"</em> angehörst, haben wir spezielle VIP-Karten für dich vorbereitet.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://starlightclub.com/rsvp" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">Teilnahme bestätigen</a>
    </div>
    
    <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">Bitte bestätige deine Teilnahme, indem du direkt auf diese E-Mail antwortest.</p>
  </div>
  <div style="background-color: #1a1d29; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #24293d;">
    Starlight Club Management • administration@starlightclub.com
  </div>
</div>`)
    setIsHtml(true)
    addLog('HTML-Beispielvorlage geladen.', 'info')
  }



  // Handle Add Member manually
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMember.first_name || !newMember.email) {
      alert('Please fill out the First Name and Email fields.')
      return
    }
    const created: Member = {
      ...newMember,
      id: Date.now().toString(),
      status: 'pending'
    }
    setMembers(prev => [...prev, created])
    setNewMember({ first_name: '', last_name: '', email: '', role: 'General Member', custom: '' })
    addLog(`Manually added member: ${created.first_name} (${created.email})`, 'info')
  }

  // Delete Member
  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    addLog('Removed member from campaign list.', 'info')
  }

  // Inline Editing Functions
  const startEditing = (member: Member) => {
    setEditingId(member.id)
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      role: member.role,
      custom: member.custom
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
  }

  const saveEditing = (id: string) => {
    if (!editForm.first_name || !editForm.email) {
      alert('Vorname und E-Mail sind Pflichtfelder.')
      return
    }
    setMembers(prev => prev.map(m => m.id === id ? {
      ...m,
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      email: editForm.email,
      role: editForm.role,
      custom: editForm.custom
    } : m))
    setEditingId(null)
    addLog(`Empfänger ${editForm.first_name} erfolgreich aktualisiert.`, 'info')
  }

  // Parse CSV
  const handleCsvImport = (append: boolean) => {
    if (!csvText.trim()) {
      setCsvError('Please paste some CSV data first.')
      return
    }

    try {
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      if (lines.length < 2) {
        setCsvError('CSV must contain a header row and at least one data row.')
        return
      }

      // Detect header delimiter
      const firstLine = lines[0]
      let delimiter = ','
      if (firstLine.includes(';')) delimiter = ';'
      else if (firstLine.includes('\t')) delimiter = '\t'

      const rawHeaders = firstLine.split(delimiter).map(h => h.replace(/['"]+/g, '').trim().toLowerCase())
      
      const headerIndices = {
        first_name: rawHeaders.findIndex(h => h.includes('first') || h === 'name'),
        last_name: rawHeaders.findIndex(h => h.includes('last') || h === 'surname'),
        email: rawHeaders.findIndex(h => h.includes('email') || h.includes('mail')),
        role: rawHeaders.findIndex(h => h.includes('role') || h.includes('title') || h.includes('position')),
        custom: rawHeaders.findIndex(h => h.includes('custom') || h.includes('info') || h.includes('join') || h.includes('note'))
      }

      if (headerIndices.email === -1) {
        setCsvError('Could not identify an "email" column in the header row.')
        return
      }

      const parsedMembers: Member[] = []

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(delimiter).map(v => v.replace(/['"]+/g, '').trim())
        
        const emailVal = row[headerIndices.email]
        if (!emailVal || !emailVal.includes('@')) continue

        let firstNameVal = 'Recipient'
        if (headerIndices.first_name !== -1 && row[headerIndices.first_name]) {
          firstNameVal = row[headerIndices.first_name]
        } else if (headerIndices.first_name === -1 && headerIndices.email !== -1) {
          firstNameVal = emailVal.split('@')[0]
        }

        const memberObj: Member = {
          id: `csv-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          first_name: firstNameVal,
          last_name: headerIndices.last_name !== -1 && row[headerIndices.last_name] ? row[headerIndices.last_name] : '',
          email: emailVal,
          role: headerIndices.role !== -1 && row[headerIndices.role] ? row[headerIndices.role] : 'Member',
          custom: headerIndices.custom !== -1 && row[headerIndices.custom] ? row[headerIndices.custom] : 'CSV Record',
          status: 'pending'
        }
        parsedMembers.push(memberObj)
      }

      if (parsedMembers.length === 0) {
        setCsvError('No valid rows with emails could be parsed.')
        return
      }

      if (append) {
        setMembers(prev => [...prev, ...parsedMembers])
        addLog(`Imported ${parsedMembers.length} members from CSV (Appended).`, 'success')
      } else {
        setMembers(parsedMembers)
        addLog(`Loaded ${parsedMembers.length} new members from CSV (Replaced old list).`, 'success')
      }
      setCsvText('')
      setCsvError('')
    } catch (e: any) {
      setCsvError(`Parsing error: ${e.message}`)
    }
  }

  // Restore Default Database
  const resetToDefaultDatabase = () => {
    if (confirm('Möchten Sie die Empfängerliste wirklich auf die Standardwerte zurücksetzen? Alle manuell hinzugefügten oder importierten Daten gehen verloren.')) {
      setMembers(DEFAULT_MEMBERS)
      addLog('Empfängerdatenbank auf Standardwerte zurückgesetzt.', 'info')
    }
  }

  // Launch/Start Campaign Sending
  const startCampaign = () => {
    if (members.length === 0) {
      alert('Your recipient list is empty. Add members or load the default list.')
      return
    }
    
    // Check credentials if using real SMTP
    if (sendMethod === 'smtp') {
      if (!smtpUser || !smtpPass) {
        alert('Please specify your SMTP username and Password/App Password in System Config first.')
        setActiveTab('config')
        return
      }
      if (backendStatus !== 'active') {
        alert('The local backend server is offline. Please make sure it is started on port 3001.')
        return
      }
    }

    if (!isPaused) {
      setMembers(prev => prev.map(m => ({ ...m, status: 'pending', logDetails: undefined, timestamp: undefined })))
      setCurrentIndex(0)
      setLogs([])
      addLog(`Starting campaign "${subject.substring(0, 30)}..." to ${members.length} recipients`, 'info')
    } else {
      addLog(`Resuming campaign at contact #${currentIndex + 1}...`, 'info')
    }

    setIsSending(true)
    setIsPaused(false)
  }

  // Pause Campaign
  const pauseCampaign = () => {
    setIsPaused(true)
    setIsSending(false)
    if (sendTimerRef.current) {
      clearTimeout(sendTimerRef.current)
      sendTimerRef.current = null
    }
    addLog('Campaign execution paused by user.', 'info')
  }

  // Reset Campaign
  const resetCampaign = () => {
    setIsSending(false)
    setIsPaused(false)
    setCurrentIndex(0)
    if (sendTimerRef.current) {
      clearTimeout(sendTimerRef.current)
      sendTimerRef.current = null
    }
    setMembers(prev => prev.map(m => ({ ...m, status: 'pending', logDetails: undefined, timestamp: undefined })))
    setLogs([])
    addLog('Campaign reset. All statuses set back to Pending.', 'info')
  }

  // Clear Campaign History
  const clearCampaignHistory = () => {
    if (confirm('Möchten Sie die Kampagnen-Historie wirklich löschen?')) {
      setCampaignHistory([])
      addLog('Kampagnen-Historie gelöscht.', 'info')
    }
  }

  // Highly robust sequential sending loop
  useEffect(() => {
    if (!isSending || isPaused) return

    let active = true

    const runCampaign = async () => {
      let index = currentIndex

      while (index < members.length && active) {
        const targetIndex = index // Capture current loop index to prevent asynchronous closure race conditions
        const currentMember = members[targetIndex]
        const timeString = new Date().toLocaleTimeString('de-CH')

        // Dispatch status info log
        addLog(`Sending to ${currentMember.first_name} <${currentMember.email}> (${targetIndex + 1}/${members.length})...`, 'info')

        // Wait for the configured inter-email delay
        await new Promise(resolve => {
          sendTimerRef.current = setTimeout(resolve, delayMs)
        })

        if (!active) break

        // Perform the dispatch action depending on the selected strategy
        if (sendMethod === 'simulated') {
          const isSuccess = Math.random() > 0.08
          
          setMembers(prev => prev.map((m, idx) => {
            if (idx === targetIndex) {
              return {
                ...m,
                status: isSuccess ? 'success' : 'error',
                logDetails: isSuccess ? 'Sent successfully via mock SMTP gateway' : 'Failed: SMTP connection timed out',
                timestamp: timeString
              }
            }
            return m
          }))

          if (isSuccess) {
            addLog(`✓ Email sent to ${currentMember.first_name} <${currentMember.email}>`, 'success')
          } else {
            addLog(`✗ Failed to send to ${currentMember.first_name} <${currentMember.email}> (SMTP Timeout)`, 'error')
          }
        } 
        
        else if (sendMethod === 'mailto') {
          let bodyText = renderTemplate(body, currentMember)
          if (isHtml) {
            bodyText = bodyText.replace(/<[^>]*>/g, '')
          }
          
          const mailSubject = encodeURIComponent(renderTemplate(subject, currentMember))
          const mailBody = encodeURIComponent(bodyText)
          const mailtoUrl = `mailto:${currentMember.email}?subject=${mailSubject}&body=${mailBody}`
          
          window.open(mailtoUrl, '_blank')
          
          setMembers(prev => prev.map((m, idx) => {
            if (idx === targetIndex) {
              return {
                ...m,
                status: 'success',
                logDetails: isHtml ? 'Mailto triggered (HTML formatting stripped)' : 'Mailto compose window triggered',
                timestamp: timeString
              }
            }
            return m
          }))
          
          addLog(`Opened mailto composer for ${currentMember.first_name} <${currentMember.email}>`, 'success')
        } 
        
        else if (sendMethod === 'smtp') {
          try {
            const response = await fetch('http://localhost:3001/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                senderName,
                senderEmail: senderEmail || smtpUser,
                smtpUser,
                smtpPass,
                recipientEmail: currentMember.email,
                subject: renderTemplate(subject, currentMember),
                body: renderTemplate(body, currentMember),
                isHtml
              })
            })

            const data = await response.json()

            if (data.success) {
              setMembers(prev => prev.map((m, idx) => {
                if (idx === targetIndex) {
                  return { 
                    ...m, 
                    status: 'success', 
                    logDetails: 'E-Mail erfolgreich gesendet via Google SMTP.',
                    timestamp: timeString
                  }
                }
                return m
              }))
              addLog(`✓ E-Mail erfolgreich an ${currentMember.first_name} <${currentMember.email}> gesendet.`, 'success')
            } else {
              setMembers(prev => prev.map((m, idx) => {
                if (idx === targetIndex) {
                  return { 
                    ...m, 
                    status: 'error', 
                    logDetails: data.error || 'SMTP Fehler',
                    timestamp: timeString
                  }
                }
                return m
              }))
              addLog(`✗ Fehler beim Senden an ${currentMember.first_name} <${currentMember.email}>: ${data.error}`, 'error')
            }
          } catch (err: any) {
            setMembers(prev => prev.map((m, idx) => {
              if (idx === targetIndex) {
                return { 
                  ...m, 
                  status: 'error', 
                  logDetails: 'Lokaler Server antwortet nicht.',
                  timestamp: timeString
                }
              }
              return m
            }))
            addLog(`✗ Verbindungsfehler: Der lokale SMTP-Server antwortet nicht. Bitte prüfen Sie, ob er läuft.`, 'error')
          }
        }

        // Increment index internally and update state
        index++
        setCurrentIndex(index)
      }

      // If we finished the loop naturally without interruption
      if (active && index >= members.length) {
        setIsSending(false)
        addLog(`Campaign completed!`, 'success')

        // Fetch the absolute latest members array to get final counts from the ref
        const latestMembers = membersRef.current
        const total = latestMembers.length
        const sent = latestMembers.filter(m => m.status === 'success').length
        const failed = latestMembers.filter(m => m.status === 'error').length
        
        const newHistoryEntry: CampaignRun = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleString('de-CH'),
          subject: subject,
          isHtml: isHtml,
          sendMethod: sendMethod,
          stats: {
            total,
            sent,
            failed
          }
        }
        setCampaignHistory(prev => [newHistoryEntry, ...prev])
      }
    }

    runCampaign()

    return () => {
      active = false
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current)
      }
    }
  }, [isSending, isPaused]) // Only run/cleanup when campaign send status changes!

  // Bound index check for preview panel
  const activePreviewMember = members[previewIndex] || members[0] || null

  const isConfigInvalid = sendMethod === 'smtp' && (!smtpUser || !smtpPass)

  return (
    <div className="app-container">
      {/* Background radial blurs */}
      <div className="bg-blur-glow"></div>

      {/* Header Bar */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">M</div>
          <span className="app-title">MailMerge</span>
        </div>
        <div className="connection-badge">
          <div className="pulse-dot" style={{ backgroundColor: backendStatus === 'active' ? 'var(--color-success)' : 'var(--color-error)', boxShadow: backendStatus === 'active' ? '0 0 8px var(--color-success)' : '0 0 8px var(--color-error)' }}></div>
          <span>
            {sendMethod === 'simulated' && 'SMTP Engine: Sandbox Mode'}
            {sendMethod === 'mailto' && 'SMTP Engine: Mailto Redirects'}
            {sendMethod === 'smtp' && (backendStatus === 'active' ? 'SMTP Bridge: Active (Google)' : 'SMTP Bridge: Offline')}
          </span>
        </div>
      </header>

      {/* Dashboard Grid Layout */}
      <main className="dashboard-grid">
        
        {/* Left Sidebar: Controls, Metrics and Logs */}
        <aside className="sidebar">
          
          <div>
            <h3 className="section-title">Campaign Metrics</h3>
            <div className="stats-container">
              <div className="stat-card">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Recipients</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.pending}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-card success">
                <span className="stat-value">{stats.sent}</span>
                <span className="stat-label">Sent</span>
              </div>
              <div className="stat-card error">
                <span className="stat-value">{stats.failed}</span>
                <span className="stat-label">Failed</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="section-title">Campaign Controls</h3>
            <div className="campaign-panel">
              <div className="progress-text">
                <span>Progress</span>
                <span>{stats.total > 0 ? Math.round(((stats.sent + stats.failed) / stats.total) * 100) : 0}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${stats.total > 0 ? ((stats.sent + stats.failed) / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              
              {!isSending ? (
                <button 
                  className="btn-primary" 
                  onClick={startCampaign}
                  disabled={members.length === 0 || isConfigInvalid}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  {isPaused ? 'Resume Campaign' : 'Send Campaign'}
                </button>
              ) : (
                <button className="btn-primary" style={{ background: 'var(--color-warning)' }} onClick={pauseCampaign}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  Pause Sending
                </button>
              )}

              {isConfigInvalid && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', textAlign: 'center' }}>
                  SMTP Zugangsdaten fehlen!
                </span>
              )}

              <button 
                className="btn-secondary" 
                onClick={resetCampaign}
                disabled={stats.sent === 0 && stats.failed === 0}
              >
                Reset Statuses
              </button>
            </div>
          </div>

          {/* Campaign History section in sidebar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>Campaign History</h3>
              {campaignHistory.length > 0 && (
                <button 
                  onClick={clearCampaignHistory}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {campaignHistory.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keine vorherigen Läufe.</span>
              ) : (
                campaignHistory.map(run => (
                  <div key={run.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>{run.timestamp}</span>
                      <span className="role-tag" style={{ padding: '0.05rem 0.25rem', fontSize: '0.65rem' }}>
                        {run.sendMethod.toUpperCase()} {run.isHtml ? 'HTML' : 'TXT'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {run.subject}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      <span>Total: {run.stats.total}</span>
                      <span style={{ color: 'var(--color-success)' }}>Sent: {run.stats.sent}</span>
                      <span style={{ color: 'var(--color-error)' }}>Failed: {run.stats.failed}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="section-title">Live Dispatch Log</h3>
            <div className="live-log-container">
              {logs.length === 0 ? (
                <span className="log-entry" style={{ color: 'var(--text-muted)' }}>Waiting to dispatch...</span>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`log-entry ${log.type}`}>
                    [{log.timestamp}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>

        </aside>

        {/* Right Panel: Content Workspaces */}
        <section className="main-panel">
          
          {/* Workspace Switcher */}
          <nav className="tabs-navigation">
            <button 
              className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              1. Recipients
            </button>
            <button 
              className={`tab-btn ${activeTab === 'template' ? 'active' : ''}`}
              onClick={() => setActiveTab('template')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              2. Email Template
            </button>
            <button 
              className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              3. System Config
            </button>
          </nav>

          {/* Tab 1: Recipients Panel */}
          {activeTab === 'contacts' && (
            <div className="panel-card slide-up">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Club Membership List</h2>
                  <p className="panel-subtitle">Manage recipients, assign roles, or import contacts via CSV data.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" onClick={resetToDefaultDatabase}>
                    Standardwerte laden
                  </button>
                  <button className="btn-secondary" style={{ color: 'var(--color-error)' }} onClick={() => setMembers([])}>
                    Datenbank leeren
                  </button>
                </div>
              </div>

              {/* CSV Import Module */}
              <div className="csv-import-box">
                <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Bulk Import Members from CSV
                </span>
                <textarea 
                  className="textarea-field" 
                  style={{ minHeight: '80px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                  placeholder={`first_name,last_name,email,role,custom
Alice,Smith,alice@example.com,Captain,Joined 2024
Bob,Johnson,bob@example.com,Treasurer,Joined 2023`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                ></textarea>
                
                {csvError && <p style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{csvError}</p>}
                
                <div className="button-group-row">
                  <button className="btn-secondary" onClick={() => handleCsvImport(true)}>
                    Append to Database
                  </button>
                  <button className="btn-secondary" onClick={() => handleCsvImport(false)}>
                    Overwrite Database
                  </button>
                </div>
              </div>

              {/* Inline Add Form */}
              <form onSubmit={handleAddMember} className="panel-card" style={{ padding: '1.25rem', gap: '1rem', background: 'var(--bg-secondary)' }}>
                <span className="form-label">Add Individual Member</span>
                <div className="form-row">
                  <div className="form-group">
                    <input 
                      type="text" 
                      placeholder="First Name" 
                      className="input-field"
                      value={newMember.first_name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      placeholder="Last Name" 
                      className="input-field"
                      value={newMember.last_name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      className="input-field"
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      placeholder="Club Role (e.g. Member, President)" 
                      className="input-field"
                      value={newMember.role}
                      onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <input 
                      type="text" 
                      placeholder="Custom Info / Tag (e.g., Joined 2024)" 
                      className="input-field"
                      value={newMember.custom}
                      onChange={(e) => setNewMember(prev => ({ ...prev, custom: e.target.value }))}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-end', padding: '0.5rem 1.5rem' }}>
                  + Insert Row
                </button>
              </form>

              {/* Table Filter Actions */}
              <div className="table-actions">
                <div className="search-input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Search database..." 
                    className="input-field" 
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg 
                    width="16" 
                    height="16" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    viewBox="0 0 24 24" 
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Showing {filteredMembers.length} of {members.length} members
                </span>
              </div>

              {/* Recipients Table */}
              <div className="table-wrapper">
                <table className="contacts-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Club Role</th>
                      <th>Info / Tag</th>
                      <th>Last Dispatch Status</th>
                      <th>Sent At</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No members matching your query.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map(member => {
                        const isEditing = editingId === member.id;
                        return (
                          <tr key={member.id}>
                            {isEditing ? (
                              <>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <input 
                                      type="text" 
                                      className="input-field" 
                                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: '90px' }}
                                      value={editForm.first_name}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                                    />
                                    <input 
                                      type="text" 
                                      className="input-field" 
                                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: '90px' }}
                                      value={editForm.last_name}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <input 
                                    type="email" 
                                    className="input-field" 
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: '180px' }}
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="input-field" 
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: '120px' }}
                                    value={editForm.role}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="input-field" 
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: '120px' }}
                                    value={editForm.custom}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, custom: e.target.value }))}
                                  />
                                </td>
                                <td>
                                  <span className={`badge ${member.status}`}>
                                    Pending (Edit)
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                  {member.timestamp || '-'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    <button 
                                      onClick={() => saveEditing(member.id)} 
                                      style={{ background: 'transparent', border: 'none', color: 'var(--color-success)', cursor: 'pointer' }}
                                      title="Speichern"
                                    >
                                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={cancelEditing} 
                                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                      title="Abbrechen"
                                    >
                                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ fontWeight: 500 }}>{member.first_name} {member.last_name}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{member.email}</td>
                                <td>
                                  <span className="role-tag">{member.role}</span>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{member.custom}</td>
                                <td>
                                  <span className={`badge ${member.status}`} title={member.logDetails}>
                                    {member.status === 'success' && '✓ Sent'}
                                    {member.status === 'error' && '✗ Failed'}
                                    {member.status === 'pending' && 'Pending'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                  {member.timestamp || '-'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                    <button 
                                      onClick={() => startEditing(member)} 
                                      style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-hover)', cursor: 'pointer' }}
                                      title="Empfänger bearbeiten"
                                    >
                                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M12 20h9"></path>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteMember(member.id)} 
                                      style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer' }}
                                      title="Empfänger löschen"
                                    >
                                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Email Template Builder */}
          {activeTab === 'template' && (
            <div className="panel-card slide-up">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Mailmerge Content & Templates</h2>
                  <p className="panel-subtitle">Create custom templates containing recipient variables for dynamic merging.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setIsHtml(false);
                      setSubject('Important Update for our {{role}}: Upcoming Starlight Club Event!');
                      setBody(`Dear {{first_name}} {{last_name}},\n\nWe are writing to you as the {{role}} of the Starlight Club.\n\nBest regards,\nClub Management`);
                    }}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Reset Text Template
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={loadHtmlSample}
                    style={{ fontSize: '0.8rem', background: 'var(--color-accent-light)', borderColor: 'var(--color-accent)' }}
                  >
                    Load HTML Demo
                  </button>
                </div>
              </div>

              <div className="template-grid">
                
                {/* Left Side: Textarea Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Format and Variable Pills Helper */}
                  <div className="form-group">
                    <label className="form-label">Email Format / Type</label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input 
                          type="radio" 
                          name="format" 
                          checked={!isHtml} 
                          onChange={() => setIsHtml(false)}
                          style={{ accentColor: 'var(--color-accent)' }}
                        />
                        Plain Text (Klartext)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input 
                          type="radio" 
                          name="format" 
                          checked={isHtml} 
                          onChange={() => setIsHtml(true)}
                          style={{ accentColor: 'var(--color-accent)' }}
                        />
                        HTML Format (Styled)
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <span className="form-label">Available Variables (Click to Insert)</span>
                    <div className="placeholders-panel">
                      <button className="placeholder-pill" onClick={() => insertPlaceholder('first_name')}>
                        {"{{first_name}}"}
                      </button>
                      <button className="placeholder-pill" onClick={() => insertPlaceholder('last_name')}>
                        {"{{last_name}}"}
                      </button>
                      <button className="placeholder-pill" onClick={() => insertPlaceholder('email')}>
                        {"{{email}}"}
                      </button>
                      <button className="placeholder-pill" onClick={() => insertPlaceholder('role')}>
                        {"{{role}}"}
                      </button>
                      <button className="placeholder-pill" onClick={() => insertPlaceholder('custom')}>
                        {"{{custom}}"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="template-subject">Email Subject Line</label>
                    <input 
                      id="template-subject"
                      type="text" 
                      className="input-field" 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="template-body">
                      {isHtml ? 'Email Body (HTML Code)' : 'Email Body (Plain Text)'}
                    </label>
                    <textarea 
                      id="template-body"
                      className="textarea-field" 
                      style={{ fontFamily: isHtml ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: isHtml ? '0.85rem' : '0.95rem' }}
                      value={body} 
                      onChange={(e) => setBody(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                {/* Right Side: Live Dynamic Preview */}
                <div>
                  <div className="preview-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="form-label" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Live Render Preview {isHtml ? '(HTML Sandbox)' : '(Plain Text)'}
                      </span>
                      {members.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button 
                            className="preview-btn"
                            onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                            disabled={previewIndex === 0}
                          >
                            ‹
                          </button>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {previewIndex + 1} / {members.length}
                          </span>
                          <button 
                            className="preview-btn"
                            onClick={() => setPreviewIndex(prev => Math.min(members.length - 1, prev + 1))}
                            disabled={previewIndex >= members.length - 1}
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>

                    {activePreviewMember ? (
                      <div className="preview-browser">
                        <div className="browser-header">
                          <div className="browser-row">
                            <span className="browser-label">To:</span>
                            <span className="browser-value">
                              {activePreviewMember.first_name} {activePreviewMember.last_name} &lt;{activePreviewMember.email}&gt;
                            </span>
                          </div>
                          <div className="browser-row">
                            <span className="browser-label">From:</span>
                            <span className="browser-value">
                              {senderName} &lt;{senderEmail || (sendMethod === 'smtp' ? smtpUser : 'system@starlightclub.com')}&gt;
                            </span>
                          </div>
                          <div className="browser-row" style={{ marginTop: '0.2rem' }}>
                            <span className="browser-label">Subject:</span>
                            <span className="browser-value browser-subject">
                              {renderTemplate(subject, activePreviewMember)}
                            </span>
                          </div>
                        </div>
                        
                        {isHtml ? (
                          <iframe 
                            title="HTML Preview Frame"
                            srcDoc={renderTemplate(body, activePreviewMember)}
                            style={{ 
                              width: '100%', 
                              height: '350px', 
                              border: 'none', 
                              backgroundColor: '#ffffff'
                            }}
                          />
                        ) : (
                          <div className="browser-body">
                            {renderTemplate(body, activePreviewMember)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 1rem' }}>
                        No contacts available to render a preview.
                      </div>
                    )}

                    {isHtml && sendMethod === 'mailto' && (
                      <div style={{ 
                        backgroundColor: 'var(--color-warning-bg)', 
                        border: '1px solid var(--color-warning-border)', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '0.75rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-warning)',
                        lineHeight: '1.4'
                      }}>
                        ⚠️ <strong>Hinweis:</strong> Das Mailto-Verfahren unterstützt keine HTML-Formatierung. Der HTML-Code wird im E-Mail-Entwurf unformatiert als Text angezeigt. Nutzen Sie die <strong>Google SMTP Bridge</strong> für formatierte HTML-Mails.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 3: Configuration & System Settings */}
          {activeTab === 'config' && (
            <div className="panel-card slide-up">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">SMTP Gateway & Configuration</h2>
                  <p className="panel-subtitle">Manage sending behaviors, sandbox limits, and sender identities.</p>
                </div>
              </div>

              <div className="config-card-grid">
                
                {/* Configuration Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 className="section-title" style={{ marginBottom: 0 }}>Sender Identity</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={senderName} 
                      onChange={(e) => setSenderName(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sender Email Address (Optional Header)</label>
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder={smtpUser || 'sender@domain.com'}
                      value={senderEmail} 
                      onChange={(e) => setSenderEmail(e.target.value)} 
                    />
                  </div>

                  <h3 className="section-title" style={{ marginBottom: 0, marginTop: '0.5rem' }}>Engine Properties</h3>

                  <div className="form-group">
                    <label className="form-label">Delivery Strategy</label>
                    <div className="select-wrapper">
                      <select 
                        className="select-field" 
                        value={sendMethod}
                        onChange={(e) => setSendMethod(e.target.value as 'simulated' | 'mailto' | 'smtp')}
                      >
                        <option value="simulated">Simulated Relay Gateway (Sandbox)</option>
                        <option value="mailto">Native Mailto Triggers (Opens local drafts)</option>
                        <option value="smtp">Custom / Google / Outlook SMTP Bridge</option>
                      </select>
                    </div>
                  </div>

                   {sendMethod === 'smtp' && (
                    <div className="panel-card" style={{ padding: '1.25rem', gap: '1rem', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                      <span className="form-label" style={{ color: 'var(--color-accent-hover)' }}>Google Gmail SMTP Bridge</span>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Google E-Mail-Adresse</label>
                        <input 
                          type="email" 
                          className="input-field" 
                          placeholder="ihre.adresse@gmail.com"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Google App-Passwort</label>
                        <input 
                          type="password" 
                          className="input-field" 
                          placeholder="••••••••••••••••"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                          Wichtig: Verwenden Sie Ihr 16-stelliges <strong>App-Passwort</strong>, das Sie in Ihrem Google-Konto unter "Sicherheit" generiert haben.
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div className="pulse-dot" style={{ backgroundColor: backendStatus === 'active' ? 'var(--color-success)' : 'var(--color-error)' }}></div>
                        <span>Backend Status: {backendStatus === 'active' ? 'Bereit (Port 3001)' : 'Offline (Bitte starten Sie den Server)'}</span>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Inter-Email Interval Delay (Milliseconds)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      min="100" 
                      max="10000"
                      value={delayMs} 
                      onChange={(e) => setDelayMs(parseInt(e.target.value) || 500)} 
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Adjusts sending interval to prevent SMTP flood errors. Currently: {(delayMs/1000).toFixed(1)} seconds.
                    </span>
                  </div>
                </div>

                {/* Strategy Explanations */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 className="section-title">Delivery Options Explained</h3>
                  
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--color-accent-hover)', marginBottom: '0.25rem' }}>SMTP Bridge (Gmail, Outlook, Custom)</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Sends emails silently in the background directly from your personal email account. Supports Google Gmail (port 465), Microsoft Outlook / Office 365 (port 587 STARTTLS), or custom SMTP mailservers.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Simulated Relay Gateway</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Ideal for testing layout placeholders and email logic. Runs a fully simulated batch mailing sequence using client side timers, reporting status logs locally.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--color-accent-secondary)', marginBottom: '0.25rem' }}>Native Mailto Triggers</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Leverages the browser's standard mail handler scheme (`mailto:`). During the campaign delivery, the tool opens individual mail compose windows pre-filled, letting you review and dispatch them manually from your desktop app.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </section>

      </main>
    </div>
  )
}

export default App
