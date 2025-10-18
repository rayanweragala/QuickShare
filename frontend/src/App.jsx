import { useState } from 'react';
import { SessionCreator, SessionJoiner } from './components/session';
import { Button, Card } from './components/common';

function App() {
  const [view, setView] = useState('home'); 

  if (view === 'sender') {
    return <SessionCreator />;
  }

  if (view === 'receiver') {
    return <SessionJoiner />;
  }

   return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center animate-fade-in" style={{ marginBottom: '4rem' }}>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-4">
            Local<span className="text-green-500">Share</span>
          </h1>
          <p className="text-neutral-300 text-xl sm:text-2xl">
            Secure peer-to-peer file sharing
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8" style={{ marginBottom: '4rem' }}>
          <div className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 animate-fade-in">
            <div className="mb-8">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">
                Send Files
              </h2>
              <p className="text-neutral-400 text-lg mt-2">
                Share anything, securely
              </p>
            </div>
            
            <button
              onClick={() => setView('sender')}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Share Session
            </button>

            <p className="text-sm text-neutral-500 mt-6">
              Get a code to share with others
            </p>
          </div>

          <div className="group bg-neutral-800/50 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-10 hover:bg-neutral-800/70 transition-all duration-300 hover:border-green-500/30 animate-fade-in">
            <div className="mb-8">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">
                Receive Files
              </h2>
              <p className="text-neutral-400 text-lg mt-2">
                Join a share session
              </p>
            </div>
            
            <button
              onClick={() => setView('receiver')}
              className="w-full bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Join with Code
            </button>

            <p className="text-sm text-neutral-500 mt-6">
              Enter a code to receive files
            </p>
          </div>
        </div>

        <div className="bg-neutral-800/30 backdrop-blur rounded-2xl border border-neutral-700 p-8 sm:p-12" style={{ marginBottom: '3rem' }}>
          <h2 className="text-3xl font-bold text-white mb-10 text-center">
            Why LocalShare?
          </h2>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Secure & Private
              </h3>
              <p className="text-neutral-400">
                Files transfer directly between devices. Nothing uploaded to servers.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Fast Transfer
              </h3>
              <p className="text-neutral-400">
                Peer-to-peer connection for maximum speed. No file size limits.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Works Everywhere
              </h3>
              <p className="text-neutral-400">
                Share between any devices with a web browser. No app needed.
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-neutral-500">
            Built with WebRTC • Open source • No tracking
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;