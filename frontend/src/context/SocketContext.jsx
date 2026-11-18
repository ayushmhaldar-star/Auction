import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeState, setRealtimeState] = useState(null);
  const [latestSoldEvent, setLatestSoldEvent] = useState(null);
  const [latestUnsoldEvent, setLatestUnsoldEvent] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to same host/port via proxy or direct window.location
    const newSocket = io({
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('auction_state_update', (data) => {
      if (data && data.state) {
        setRealtimeState(data.state);
      }
    });

    newSocket.on('public_state_update', (data) => {
      if (data) {
        setRealtimeState(data);
      }
    });

    newSocket.on('player_sold_event', (data) => {
      setLatestSoldEvent(data);
    });

    newSocket.on('player_unsold_event', (data) => {
      setLatestUnsoldEvent(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinAuction = (role = 'public') => {
    if (socketRef.current) {
      socketRef.current.emit('join_auction', { role });
    }
  };

  const clearCelebration = () => {
    setLatestSoldEvent(null);
    setLatestUnsoldEvent(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        realtimeState,
        setRealtimeState,
        latestSoldEvent,
        latestUnsoldEvent,
        clearCelebration,
        joinAuction
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
