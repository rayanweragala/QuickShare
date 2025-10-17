import { useState } from 'react';
import { Check, Copy, Users, Clock, Share2, X, CheckCircle } from 'lucide-react';

export const RoomSuccessModal = ({ isOpen, onClose, room }) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyToClipboard = (text, isLink = false) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="relative bg-zinc-900/50 border-b border-green-500/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Room Created Successfully!</h2>
                <p className="text-sm text-zinc-400">Your sharing space is ready</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="relative overflow-hidden bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4 border border-green-500/20">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{room.roomName}</h3>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <span className="text-3xl font-mono font-bold text-green-400 tracking-wider">{room.roomCode}</span>
                <button
                  onClick={() => copyToClipboard(room.roomCode)}
                  className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                  title="Copy room code"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-zinc-400" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-3">Share this code with others to join</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium">Participants</span>
                </div>
                <p className="text-lg font-bold text-white">{room.participantCount}/{room.maxParticipants}</p>
              </div>
            </div>

            <div className="relative overflow-hidden bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium">Expires</span>
                </div>
                <p className="text-lg font-bold text-white">
                  {room.expiresAt ? new Date(room.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {room.shareableLink && (
            <div className="relative overflow-hidden bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl" />
              <div className="relative">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                  <Share2 className="w-4 h-4 text-green-400" />
                  Share Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={room.shareableLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                  <button
                    onClick={() => copyToClipboard(room.shareableLink, true)}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-lg shadow-green-500/20"
                    title="Copy share link"
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-105"
          >
            Start Sharing Files
          </button>
        </div>
      </div>
    </div>
  );
};