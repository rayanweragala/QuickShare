import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import {roomAPI} from "../../api/hooks/useRooms"
import { Upload, Share2, Users, Clock, Lock, Globe, X, Plus, Copy, Check, Search, Download, Trash2, FileIcon, QrCode } from 'lucide-react';

export const PublicRoomsList = ({ onJoinRoom }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['publicRooms', page, searchQuery],
    queryFn: () => searchQuery 
      ? roomAPI.searchRooms(searchQuery, page, 10)
      : roomAPI.getPublicRooms(page, 10),
  });

  const rooms = roomsData?.content || [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search public rooms..."
          className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-neutral-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No public rooms found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="p-4 border border-neutral-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => onJoinRoom(room.roomCode)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-neutral-900 group-hover:text-green-600 transition-colors">{room.roomName}</h3>
                  <p className="text-sm text-neutral-500">by {room.creatorAnimalName}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {room.roomCode}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-neutral-600">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{room.participantCount}/{room.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileIcon className="w-3.5 h-3.5" />
                  <span>{room.fileCount || 0} files</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  <span>{room.totalDownloads || 0} downloads</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {roomsData && roomsData.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-neutral-600">
            Page {page + 1} of {roomsData.totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= roomsData.totalPages - 1}
            className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};