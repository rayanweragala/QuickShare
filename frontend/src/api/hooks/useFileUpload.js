import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateUserId, generateSessionId } from "../../utils/userManager";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL  || "/api/v1";

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text}`);
  }
  return response.json();
}

const fileAPI = {
  initiateUpload: async (roomCode, fileData) => {
    const userId = getOrCreateUserId();
    const socketId = generateSessionId();

    return await fetchJSON(`${API_BASE_URL}/rooms/${roomCode}/files/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
        "X-Socket-Id": socketId,
      },
      body: JSON.stringify({
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
        checksum: fileData.checksum,
      }),
    });
  },

  uploadToR2: async (uploadUrl, file, onProgress) => {
    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round(
            (event.loaded * 100) / event.total
          );
          onProgress?.(percentCompleted);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });
  },

  completeUpload: async (roomCode, fileId) => {
    const socketId = generateSessionId();
    const userId = getOrCreateUserId();

    return await fetchJSON(`${API_BASE_URL}/rooms/${roomCode}/files/${fileId}/complete`, {
      method: "POST",
      headers: {
        "X-Socket-Id": socketId,
        'X-User-ID': userId
      },
    });
  },

  getDownloadUrl: async (roomCode, fileId) => {
    return await fetchJSON(`${API_BASE_URL}/rooms/${roomCode}/files/${fileId}/download`);
  },

  deleteFile: async (roomCode, fileId) => {
    const socketId = generateSessionId();
    const userId = getOrCreateUserId();

    return await fetchJSON(`${API_BASE_URL}/rooms/${roomCode}/files/${fileId}`, {
      method: "DELETE",
      headers: {
        "X-Socket-Id": socketId,
        "X-User-ID" : userId
      },
    });
  },

  cancelUpload: async (roomCode, fileId) => {
    const socketId = generateSessionId();
    const userId = getOrCreateUserId();

    return await fetchJSON(`${API_BASE_URL}/rooms/${roomCode}/files/${fileId}/cancel`, {
      method: "DELETE",
      headers: {
        "X-Socket-Id": socketId,
        "X-User-ID" : userId

      },
    });
  },
};

const calculateChecksum = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const useFileUpload = (roomCode) => {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, onProgress }) => {
      const checksum = await calculateChecksum(file);

      const initiateResponse = await fileAPI.initiateUpload(roomCode, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        checksum,
      });

      await fileAPI.uploadToR2(initiateResponse.uploadUrl, file, onProgress);

      const completeResponse = await fileAPI.completeUpload(
        roomCode,
        initiateResponse.fileId
      );

      return completeResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["roomDetails"]);
    },
  });

  return uploadMutation;
};

export const useFileDownload = () => {
  return useMutation({
    mutationFn: async ({ roomCode, fileId, fileName }) => {
      const { downloadUrl } = await fileAPI.getDownloadUrl(roomCode, fileId);

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
  });
};

export const useFileDelete = (roomCode) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId }) => fileAPI.deleteFile(roomCode, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries(["roomDetails"]);
    },
  });
};

export const useUploadCancel = (roomCode) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId }) => fileAPI.cancelUpload(roomCode, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries(["roomDetails"]);
    },
  });
};
