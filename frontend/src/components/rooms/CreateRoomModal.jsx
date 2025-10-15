import { useState } from "react";
import { useMutation } from '@tanstack/react-query';
import {roomAPI} from "../../api/hooks/useRooms"
import {Modal} from "../../components/common/Modal";
import { Upload, Share2, Users, Clock, Lock, Globe, X, Plus, Copy, Check, Search, Download, Trash2, FileIcon, QrCode } from 'lucide-react';

const CreateRoomModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customRoomName: '',
    visibility: 'PUBLIC',
    expirationHours: 24,
    creatorOnlyUpload: false,
    maxParticipants: 10,
  });

  const createMutation = useMutation({
    mutationFn: roomAPI.createRoom,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Room" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Room Name (Optional)
          </label>
          <input
            type="text"
            value={formData.customRoomName}
            onChange={(e) => setFormData({ ...formData, customRoomName: e.target.value })}
            placeholder="Auto-generated if left empty"
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Expires In (Hours)
            </label>
            <input
              type="number"
              value={formData.expirationHours}
              onChange={(e) => setFormData({ ...formData, expirationHours: parseInt(e.target.value) })}
              min="1"
              max="168"
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Max Participants
          </label>
          <input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
            min="2"
            max="100"
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
          <input
            type="checkbox"
            id="creatorOnly"
            checked={formData.creatorOnlyUpload}
            onChange={(e) => setFormData({ ...formData, creatorOnlyUpload: e.target.checked })}
            className="w-5 h-5 text-green-600 border-neutral-300 rounded focus:ring-2 focus:ring-green-500"
          />
          <label htmlFor="creatorOnly" className="text-sm font-medium text-neutral-700">
            Only I can upload files
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
    </Modal>
  );
};

export default CreateRoomModal;