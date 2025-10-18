import { useState } from 'react';
import { Check, Copy, Users, Clock, Share2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export const RoomSuccessModal = ({ isOpen, onClose, room }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Created Successfully!" size="md">
      <div className="space-y-6">
        <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">{room.roomName}</h3>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-sm border border-green-200">
            <span className="text-3xl font-mono font-bold text-green-600 tracking-wider">{room.roomCode}</span>
            <button
              onClick={() => copyToClipboard(room.roomCode)}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-neutral-400" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-2 text-neutral-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Participants</span>
            </div>
            <p className="text-lg font-bold text-neutral-900">{room.participantCount}/{room.maxParticipants}</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-2 text-neutral-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Expires</span>
            </div>
            <p className="text-lg font-bold text-neutral-900">{room.expiresAt ? new Date(room.expiresAt).toLocaleTimeString() : 'N/A'}</p>
          </div>
        </div>

        {room.shareableLink && (
          <div className="p-4 bg-neutral-50 rounded-lg">
            <label className="text-xs font-medium text-neutral-600 mb-2 block">Share Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={room.shareableLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm"
              />
              <button
                onClick={() => copyToClipboard(room.shareableLink)}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Start Sharing Files
        </button>
      </div>
    </Modal>
  );
};
