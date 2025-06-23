import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* Declare VS Code API */
declare function acquireVsCodeApi(): any;

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const vscode = acquireVsCodeApi();

  const sendMessage = () => {
    if (input.includes('@')) {
      vscode.postMessage({ command: 'selectFile', input });
    } else {
      sendToOpenAI(input);
    }
    setInput('');
  };

  const sendToOpenAI = (content: string) => {
    const message = { role: 'user', content };
    setMessages(prev => [...prev, message]);

    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an AI coding assistant.' },
          ...messages,
          message
        ]
      })
    })
      .then(res => res.json())
      .then(data => {
        const reply = data.choices?.[0]?.message;
        if (reply) {
          setMessages(prev => [...prev, reply]);
        }
      });
  };

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;

      if (message.command === 'context') {
        setMessages(prev => [
          ...prev,
          { role: 'system', content: `File context:\n${message.text}` }
        ]);
      }

      if (message.command === 'fileSelected') {
        const userMessage = message.input;
        const fileContent = message.fileContent;
        const fullMessage = `${userMessage}\n\n[Attached File Content]\n\`\`\`\n${fileContent}\n\`\`\``;
        sendToOpenAI(fullMessage);
      }
    });
  }, []);

  return (
    <div>
      <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <strong>{msg.role}</strong>:
            <ReactMarkdown
              children={msg.content}
              components={{
               code({ node, className, children, ...props }: any) {
  const inline = props.inline;
  const match = /language-(\w+)/.exec(className || '');

  return !inline && match ? (
    <SyntaxHighlighter
      style={oneDark}
      language={match[1]}
      PreTag="div"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

              }}
            />
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Ask something..."
        style={{ width: '80%', marginRight: '8px' }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
