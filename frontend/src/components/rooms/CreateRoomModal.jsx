import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { roomAPI } from "../../api/hooks/useRooms";
import {
  Plus,
  Lock,
  Globe,
  Clock,
  Users,
  X,
  ChevronDown,
  Check,
  TrendingUp, 
} from "lucide-react";
import { Listbox } from "@headlessui/react";
import { ErrorMessage } from "../common";
import { getOrCreateUserId } from "../../utils/userManager";

const CreateRoomModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customRoomName: "",
    visibility: "PUBLIC",
    expirationHours: 24,
    creatorOnlyUpload: false,
    maxParticipants: 10,
    isFeatured: false,
  });

  const [userId] = useState(getOrCreateUserId());

  const createMutation = useMutation({
    mutationFn: (data) => roomAPI.createRoom({ ...data, userId }),
    onSuccess: (data) => {
      onSuccess(data);
      onClose();
      setFormData({
        customRoomName: "",
        visibility: "PUBLIC",
        expirationHours: 24,
        creatorOnlyUpload: false,
        maxParticipants: 10,
        isFeatured: false,
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    createMutation.mutate(payload);
  };

  const handleDismissError = () => {
    createMutation.reset();
  };

  if (!isOpen) return null;

  const visibilityOptions = [
    { value: "PUBLIC", label: "Public", icon: Globe },
    { value: "PRIVATE", label: "Private", icon: Lock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="relative bg-zinc-900/50 border-b border-green-500/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                <Plus className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Create New Room
                </h2>
                <p className="text-sm text-zinc-400">
                  Set up your sharing space
                </p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-2">
              <Globe className="w-4 h-4 text-green-400" />
              Room Name (Optional)
            </label>
            <input
              type="text"
              value={formData.customRoomName}
              onChange={(e) =>
                setFormData({ ...formData, customRoomName: e.target.value })
              }
              placeholder="Auto-generated if left empty"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Listbox
                value={formData.visibility}
                onChange={(value) =>
                  setFormData({ ...formData, visibility: value })
                }
              >
                <Listbox.Label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  Visibility
                </Listbox.Label>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-zinc-800 py-3 pl-4 pr-10 text-left border border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 transition-all">
                    <span className="block truncate text-white">
                      {
                        visibilityOptions.find(
                          (opt) => opt.value === formData.visibility
                        )?.label
                      }
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown
                        className="h-5 w-5 text-zinc-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10 border border-zinc-700">
                    {visibilityOptions.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-green-500/20 text-green-300"
                              : "text-zinc-300"
                          }`
                        }
                        value={option.value}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-medium text-white"
                                  : "font-normal"
                              }`}
                            >
                              {option.label}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-400">
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-2">
                <Clock className="w-4 h-4 text-green-400" />
                Expires In (Hours)
              </label>
              <input
                type="number"
                value={formData.expirationHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expirationHours: parseInt(e.target.value),
                  })
                }
                min="1"
                max="168"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-2">
              <Users className="w-4 h-4 text-green-400" />
              Max Participants
            </label>
            <input
              type="number"
              value={formData.maxParticipants}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxParticipants: parseInt(e.target.value),
                })
              }
              min="2"
              max="100"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Feature Room
            </label>
            <div className="relative overflow-hidden bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="relative flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onChange={(e) =>
                            setFormData({ ...formData, isFeatured: e.target.checked })
                        }
                        className="w-5 h-5 bg-zinc-700 border-2 border-zinc-600 rounded text-green-500 focus:ring-2 focus:ring-green-500/50 focus:ring-offset-0 cursor-pointer"
                    />
                    <label
                        htmlFor="isFeatured"
                        className="flex-1 text-sm font-medium text-zinc-300 cursor-pointer select-none"
                    >
                        Feature this room on the main page for easy access
                    </label>
                </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3">
              <input
                type="checkbox"
                id="creatorOnly"
                checked={formData.creatorOnlyUpload}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    creatorOnlyUpload: e.target.checked,
                  })
                }
                className="w-5 h-5 bg-zinc-700 border-2 border-zinc-600 rounded text-green-500 focus:ring-2 focus:ring-green-500/50 focus:ring-offset-0 cursor-pointer transition-all"
              />
              <label
                htmlFor="creatorOnly"
                className="flex-1 text-sm font-medium text-zinc-300 cursor-pointer select-none"
              >
                Only I can upload files (viewers can only download)
              </label>
            </div>
          </div>

          {createMutation.isError && (
            <ErrorMessage
              message={
                createMutation.error?.message ||
                "Failed to create room. Please try again."
              }
              onDismiss={handleDismissError}
              className="mb-4"
            />
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-700 hover:border-zinc-600 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-105"
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