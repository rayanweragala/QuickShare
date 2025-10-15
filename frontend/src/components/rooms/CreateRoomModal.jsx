import { useState } from "react";
import { useMutation } from '@tanstack/react-query';
import { roomAPI } from "../../api/hooks/useRooms"
import { Plus, Lock, Globe, Clock, Users, X } from 'lucide-react';
import { ErrorMessage } from "../common";
import { getOrCreateUserId } from "../../utils/userManager";

const CreateRoomModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customRoomName: '',
    visibility: 'PUBLIC',
    expirationHours: 24,
    creatorOnlyUpload: false,
    maxParticipants: 10,
  });

  const [userId] = useState(getOrCreateUserId());

  const createMutation = useMutation({
    mutationFn: (data) => roomAPI.createRoom({ ...data, userId }), 
    onSuccess: (data) => {
      onSuccess(data);
      onClose();
      setFormData({
        customRoomName: '',
        visibility: 'PUBLIC',
        expirationHours: 24,
        creatorOnlyUpload: false,
        maxParticipants: 10,
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDismissError = () => {
    createMutation.reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden">
        <div className="relative bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-b border-green-500/30 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Room</h2>
                <p className="text-sm text-neutral-400">Set up your sharing space</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300 mb-2">
              <Globe className="w-4 h-4 text-green-400" />
              Room Name (Optional)
            </label>
            <input
              type="text"
              value={formData.customRoomName}
              onChange={(e) => setFormData({ ...formData, customRoomName: e.target.value })}
              placeholder="Auto-generated if left empty"
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300 mb-2">
                <Lock className="w-4 h-4 text-green-400" />
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300 mb-2">
                <Clock className="w-4 h-4 text-green-400" />
                Expires In (Hours)
              </label>
              <input
                type="number"
                value={formData.expirationHours}
                onChange={(e) => setFormData({ ...formData, expirationHours: parseInt(e.target.value) })}
                min="1"
                max="168"
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300 mb-2">
              <Users className="w-4 h-4 text-green-400" />
              Max Participants
            </label>
            <input
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
              min="2"
              max="100"
              className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <input
                type="checkbox"
                id="creatorOnly"
                checked={formData.creatorOnlyUpload}
                onChange={(e) => setFormData({ ...formData, creatorOnlyUpload: e.target.checked })}
                className="w-5 h-5 bg-neutral-700 border-2 border-neutral-600 rounded text-green-500 focus:ring-2 focus:ring-green-500/50 focus:ring-offset-0 cursor-pointer transition-all"
              />
              <label htmlFor="creatorOnly" className="flex-1 text-sm font-medium text-neutral-300 cursor-pointer select-none">
                Only I can upload files (viewers can only download)
              </label>
            </div>
          </div>

          {createMutation.isError && (
            <ErrorMessage
              message={createMutation.error?.message || "Failed to create room. Please try again."}
              onDismiss={handleDismissError}
              className="mb-4"
            />
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-neutral-800/50 border-2 border-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-800 hover:border-neutral-600 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-105"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Room
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;