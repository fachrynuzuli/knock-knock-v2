import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updatePlayerPosition, toggleActivityForm, toggleLeaderboard } from '../store/slices/gameStateSlice';
import { useGameContext } from '../contexts/GameContext';

import GameMap from './GameMap';
import Player from './Player';
import ActivityBoard from './ActivityBoard';
import ActivityForm from './ActivityForm';
import Leaderboard from './Leaderboard';
import GameHUD from './GameHUD';

interface CollisionObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'tree' | 'bush' | 'fence' | 'water';
}

const Game: React.FC = () => {
  const dispatch = useDispatch();
  const { playerName, playerAvatar, isFormOpen, openForm, closeForm, viewingTeammate, setViewingTeammate } = useGameContext();
  const { playerPosition, isLeaderboardOpen } = useSelector((state: RootState) => state.gameState);
  const teammates = useSelector((state: RootState) => state.teammates.items);
  
  const [keysPressed, setKeysPressed] = useState<Record<string, boolean>>({});
  const [interactionPrompt, setInteractionPrompt] = useState<{show: boolean, message: string, x: number, y: number}>({
    show: false,
    message: '',
    x: 0,
    y: 0
  });

  // Define invisible collision objects
  const invisibleCollisionObjects: CollisionObject[] = [
    // Trees along the top fence
    { x: 32, y: 16, width: 48, height: 48, type: 'tree' },
    { x: 160, y: 16, width: 48, height: 48, type: 'tree' },
    { x: 288, y: 16, width: 48, height: 48, type: 'tree' },
    { x: 416, y: 16, width: 48, height: 48, type: 'tree' },
    { x: 544, y: 16, width: 48, height: 48, type: 'tree' },
    
    // Bushes around houses
    { x: 320, y: 160, width: 32, height: 32, type: 'bush' },
    { x: 368, y: 160, width: 32, height: 32, type: 'bush' },
    { x: 416, y: 160, width: 32, height: 32, type: 'bush' },
    
    // Fences
    { x: 0, y: 0, width: 1536, height: 16, type: 'fence' }, // Top fence
    { x: 0, y: 704, width: 1536, height: 16, type: 'fence' }, // Bottom fence
    { x: 0, y: 0, width: 16, height: 720, type: 'fence' }, // Left fence
    { x: 1520, y: 0, width: 16, height: 720, type: 'fence' }, // Right fence
    
    // Water features
    { x: 96, y: 480, width: 64, height: 32, type: 'water' },
    { x: 1376, y: 480, width: 64, height: 32, type: 'water' },
  ];
  
  // Collision detection helper function
  const checkCollision = (newX: number, newY: number): boolean => {
    const playerBounds = {
      left: newX - 16,
      right: newX + 16,
      top: newY - 24,
      bottom: newY + 24
    };

    // Check collision with invisible objects
    for (const obj of invisibleCollisionObjects) {
      const objBounds = {
        left: obj.x,
        right: obj.x + obj.width,
        top: obj.y,
        bottom: obj.y + obj.height
      };

      if (
        playerBounds.right > objBounds.left &&
        playerBounds.left < objBounds.right &&
        playerBounds.bottom > objBounds.top &&
        playerBounds.top < objBounds.bottom
      ) {
        return true;
      }
    }

    // Check collision with teammate houses
    for (const teammate of teammates) {
      const houseBounds = {
        left: teammate.housePosition.x,
        right: teammate.housePosition.x + 64,
        top: teammate.housePosition.y,
        bottom: teammate.housePosition.y + 64
      };

      if (
        playerBounds.right > houseBounds.left &&
        playerBounds.left < houseBounds.right &&
        playerBounds.bottom > houseBounds.top &&
        playerBounds.top < houseBounds.bottom
      ) {
        return true;
      }
    }

    // Check collision with player's house
    const playerHouse = {
      left: 750,
      right: 814, // 750 + 64
      top: 200,
      bottom: 264 // 200 + 64
    };

    if (
      playerBounds.right > playerHouse.left &&
      playerBounds.left < playerHouse.right &&
      playerBounds.bottom > playerHouse.top &&
      playerBounds.top < playerHouse.bottom
    ) {
      return true;
    }

    // Check map boundaries
    if (
      playerBounds.left < 16 ||
      playerBounds.right > 1264 ||
      playerBounds.top < 24 ||
      playerBounds.bottom > 696
    ) {
      return true;
    }

    return false;
  };
  
  // Handle key presses for movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
      
      // Handle interaction key
      if ((e.key === 'e' || e.key === ' ') && interactionPrompt.show) {
        // Find which teammate's house we're near
        const nearbyTeammate = teammates.find(teammate => {
          const dx = Math.abs((playerPosition.x) - (teammate.housePosition.x + 32));
          const dy = Math.abs((playerPosition.y) - (teammate.housePosition.y + 32));
          return dx < 48 && dy < 48;
        });
        
        if (nearbyTeammate) {
          setViewingTeammate(nearbyTeammate.name);
        } else {
          // If near player's own board
          const playerHouse = {
            x: 782,
            y: 232
          };
          
          const dx = Math.abs((playerPosition.x) - (playerHouse.x + 32));
          const dy = Math.abs((playerPosition.y) - (playerHouse.y + 32));
          
          if (dx < 48 && dy < 48) {
            openForm();
          }
        }
      }
      
      // ESC key to close forms
      if (e.key === 'Escape') {
        if (viewingTeammate) {
          setViewingTeammate(null);
        } else if (isFormOpen) {
          closeForm();
        } else if (isLeaderboardOpen) {
          dispatch(toggleLeaderboard());
        }
      }
      
      // L key to toggle leaderboard
      if (e.key.toLowerCase() === 'l') {
        dispatch(toggleLeaderboard());
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerPosition, interactionPrompt, teammates, dispatch, openForm, closeForm, isFormOpen, isLeaderboardOpen, viewingTeammate, setViewingTeammate]);
  
  // Handle movement based on pressed keys
  useEffect(() => {
    const moveSpeed = 5;
    
    const moveInterval = setInterval(() => {
      let newX = playerPosition.x;
      let newY = playerPosition.y;
      
      if (keysPressed.w || keysPressed.arrowup) {
        const testY = newY - moveSpeed;
        if (!checkCollision(newX, testY)) {
          newY = testY;
        }
      }
      if (keysPressed.s || keysPressed.arrowdown) {
        const testY = newY + moveSpeed;
        if (!checkCollision(newX, testY)) {
          newY = testY;
        }
      }
      if (keysPressed.a || keysPressed.arrowleft) {
        const testX = newX - moveSpeed;
        if (!checkCollision(testX, newY)) {
          newX = testX;
        }
      }
      if (keysPressed.d || keysPressed.arrowright) {
        const testX = newX + moveSpeed;
        if (!checkCollision(testX, newY)) {
          newX = testX;
        }
      }
      
      if (newX !== playerPosition.x || newY !== playerPosition.y) {
        dispatch(updatePlayerPosition({ x: newX, y: newY }));
      }
      
      // Check for nearby interaction opportunities
      const playerHouse = {
        x: 782,
        y: 232
      };
      
      let foundInteraction = false;
      
      // Check if near player's own board
      const dxPlayer = Math.abs((newX) - (playerHouse.x + 32));
      const dyPlayer = Math.abs((newY) - (playerHouse.y + 32));
      
      if (dxPlayer < 48 && dyPlayer < 48) {
        setInteractionPrompt({
          show: true,
          message: 'Press E to update your board',
          x: playerHouse.x,
          y: playerHouse.y - 40
        });
        foundInteraction = true;
      }
      
      // Check if near teammate houses
      if (!foundInteraction) {
        for (const teammate of teammates) {
          const dx = Math.abs((newX) - (teammate.housePosition.x + 32));
          const dy = Math.abs((newY) - (teammate.housePosition.y + 32));
          
          if (dx < 48 && dy < 48) {
            setInteractionPrompt({
              show: true,
              message: `Press E to view ${teammate.name}'s board`,
              x: teammate.housePosition.x,
              y: teammate.housePosition.y - 40
            });
            foundInteraction = true;
            break;
          }
        }
      }
      
      if (!foundInteraction) {
        setInteractionPrompt({ show: false, message: '', x: 0, y: 0 });
      }
      
    }, 33); // ~30fps
    
    return () => clearInterval(moveInterval);
  }, [keysPressed, playerPosition, dispatch, teammates]);
  
  return (
    <div className="game-container bg-gray-900">
      <GameMap />
      
      {/* Player */}
      <Player
        position={playerPosition}
        avatarId={playerAvatar}
        name={playerName}
        isMoving={
          keysPressed.w || keysPressed.a || keysPressed.s || keysPressed.d ||
          keysPressed.arrowup || keysPressed.arrowleft || keysPressed.arrowdown || keysPressed.arrowright
        }
        direction={
          keysPressed.w || keysPressed.arrowup ? 'up' :
          keysPressed.s || keysPressed.arrowdown ? 'down' :
          keysPressed.a || keysPressed.arrowleft ? 'left' :
          keysPressed.d || keysPressed.arrowright ? 'right' : 'down'
        }
      />
      
      {/* Houses and Boards */}
      {teammates.map((teammate) => (
        <div 
          key={teammate.id}
          className="absolute"
          style={{
            left: `${teammate.housePosition.x}px`,
            top: `${teammate.housePosition.y}px`,
          }}
        >
          <div className="house" style={{ width: '64px', height: '64px' }}>
            <img 
              src={`/houses/house-${teammate.houseType}-level-${teammate.houseLevel}.png`}
              alt={`${teammate.name}'s house`}
              className="pixel-art"
            />
            <div className="text-white text-xs font-pixel text-center mt-1">{teammate.name}</div>
          </div>
        </div>
      ))}
      
      {/* Player's house */}
      <div 
        className="absolute"
        style={{
          left: '750px',
          top: '200px',
        }}
      >
        <div className="house" style={{ width: '64px', height: '64px' }}>
          <img 
            src="/houses/house-0-level-1.png"
            alt="Your house"
            className="pixel-art"
          />
          <div className="text-white text-xs font-pixel text-center mt-1">{playerName}</div>
        </div>
      </div>
      
      {/* Interaction Prompt */}
      {interactionPrompt.show && (
        <div 
          className="absolute bg-gray-800 bg-opacity-80 px-3 py-1 rounded-lg text-white text-sm font-pixel z-30 animate-bounce-slow"
          style={{
            left: `${interactionPrompt.x - 100}px`,
            top: `${interactionPrompt.y}px`,
            width: '200px',
            textAlign: 'center',
          }}
        >
          {interactionPrompt.message}
        </div>
      )}
      
      {/* HUD */}
      <GameHUD />
      
      {/* Activity Forms and Boards */}
      {isFormOpen && <ActivityForm onClose={closeForm} />}
      
      {viewingTeammate && (
        <ActivityBoard 
          teammate={viewingTeammate} 
          onClose={() => setViewingTeammate(null)} 
        />
      )}
      
      {isLeaderboardOpen && <Leaderboard />}
    </div>
  );
};

export default Game;