import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { roomAPI } from "./api/hooks/useRooms";
import { useFeaturedRoomsSocket } from "./api/hooks/useFeaturedRoomsSocket";
import { usePublicRoomsSocket } from "./api/hooks/usePublicRoomsSocket";
import HeroSection from "./components/home/HeroSection";
import SendCard from "./components/home/SendCard";
import ReceiveCard from "./components/home/ReceiveCard";
import FeaturedPanel from "./components/home/FeaturedPanel";
import PublicRoomsGrid from "./components/home/PublicRoomsGrid";
import WhySection from "./components/home/WhySection";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import RootLayout from "./components/layout/RootLayout";
import CreateRoomDialog from "./components/rooms/CreateRoomDialog";
import RoomDialog from "./components/rooms/RoomDialog";
import RoomsListDialog from "./components/rooms/RoomsListDialog";
import RoomSuccessDialog from "./components/rooms/RoomSuccessDialog";
import SessionCreator from "./components/session/SessionCreator";
import SessionJoiner from "./components/session/SessionJoiner";
import { statsService } from "./services/stats.service";

function HomeView({
  featuredRooms,
  publicRooms,
  onSend,
  onBroadcast,
  onReceive,
  onOpenRoom,
  onOpenRoomsList,
  onToggleFeatured,
}) {
  return (
    <>
      <HeroSection onSend={onSend} onReceive={onReceive} />

      <section className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-2 md:px-6">
        <SendCard onSendOne={onSend} onSendMany={onBroadcast} />
        <ReceiveCard onJoin={onReceive} />
      </section>

      <FeaturedPanel rooms={featuredRooms} onOpenRoom={onOpenRoom} onToggleFeatured={onToggleFeatured} />
      <PublicRoomsGrid rooms={publicRooms} onOpenRoom={onOpenRoom} onViewAll={onOpenRoomsList} />
      <WhySection />
      <Footer />
    </>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("home");
  const [joinCode, setJoinCode] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showRoomsList, setShowRoomsList] = useState(false);
  const [showRoomSuccess, setShowRoomSuccess] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [selectedRoomCode, setSelectedRoomCode] = useState("");

  const [stats, setStats] = useState({ totalFiles: 0, totalSessions: 0, todayFiles: 0, publicRooms: 0 });
  const { isConnected: isPublicSocketConnected } = usePublicRoomsSocket(true);
  const { featuredRooms, toggleFeatured } = useFeaturedRoomsSocket();

  const publicRoomsQuery = useQuery({
    queryKey: ["publicRooms", "app-grid"],
    queryFn: () => roomAPI.searchRoomsAdvanced({ page: 0, size: 12, sortBy: "recent" }),
    placeholderData: (previous) => previous,
  });
  const publicRooms = useMemo(() => publicRoomsQuery.data?.content || [], [publicRoomsQuery.data]);

  useEffect(() => {
    const update = () => {
      const all = statsService.getStats();
      const today = statsService.getTodayStats();
      setStats({
        totalFiles: all.totalFiles || 0,
        totalSessions: all.totalSessions || 0,
        todayFiles: today.files || 0,
        publicRooms: publicRooms.length,
      });
    };
    update();
    const id = setInterval(update, 3000);
    return () => clearInterval(id);
  }, [publicRooms.length]);

  const openRoom = (roomCode) => {
    setSelectedRoomCode(roomCode);
  };

  const resetHome = () => {
    setView("home");
    setJoinCode("");
  };

  const handleReceive = (code = "") => {
    if (code && code.length !== 6) {
      toast.error("Session code must be 6 characters.");
      return;
    }
    setJoinCode(code);
    setView("receiver");
  };

  const onCreatedRoom = (room) => {
    setCreatedRoom(room);
    setShowRoomSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["publicRooms"] });
  };

  const screen = useMemo(() => {
    if (view === "sender") return <SessionCreator onSessionEnd={resetHome} />;
    if (view === "broadcast") return <SessionCreator onSessionEnd={resetHome} isBroadcast />;
    if (view === "receiver") return <SessionJoiner onSessionEnd={resetHome} initialCode={joinCode} />;
    return (
      <HomeView
        featuredRooms={featuredRooms}
        publicRooms={publicRooms}
        onSend={() => setView("sender")}
        onBroadcast={() => setView("broadcast")}
        onReceive={handleReceive}
        onOpenRoom={openRoom}
        onOpenRoomsList={() => setShowRoomsList(true)}
        onToggleFeatured={toggleFeatured}
      />
    );
  }, [view, joinCode, featuredRooms, publicRooms, toggleFeatured]);

  return (
    <RootLayout>
      <Toaster richColors position="top-right" />

      {view === "home" && (
        <Header
          stats={stats}
          onHome={() => setView("home")}
          onCreateRoom={() => setShowCreateRoom(true)}
          isSocketConnected={isPublicSocketConnected}
        />
      )}

      <main className="mx-auto max-w-screen-2xl px-0 py-4">{screen}</main>

      <CreateRoomDialog open={showCreateRoom} onOpenChange={setShowCreateRoom} onSuccess={onCreatedRoom} />
      <RoomSuccessDialog open={showRoomSuccess} onOpenChange={setShowRoomSuccess} room={createdRoom} />
      <RoomsListDialog open={showRoomsList} onOpenChange={setShowRoomsList} onOpenRoom={openRoom} />
      <RoomDialog open={Boolean(selectedRoomCode)} onOpenChange={(v) => !v && setSelectedRoomCode("")} roomCode={selectedRoomCode} />
    </RootLayout>
  );
}
