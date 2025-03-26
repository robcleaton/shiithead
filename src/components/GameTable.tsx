
import React, { useState, useRef, useEffect } from 'react';
import { CardValue } from '@/context/GameContext';
import { Button } from './ui/button';
import { HandMetal, Flame, Send, X } from 'lucide-react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Drawer, DrawerContent, DrawerTrigger } from './ui/drawer';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { cn } from '@/lib/utils';

interface GameTableProps {
  pile: CardValue[];
  deckCount: number;
  onDrawCard: () => void;
  onPickupPile: () => void;
  currentPlayer: string;
  isCurrentPlayer: boolean;
  mustPickUpPileOrPlayThree: boolean;
}

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

const GameTable: React.FC<GameTableProps> = ({ 
  pile, 
  deckCount, 
  onDrawCard, 
  onPickupPile,
  currentPlayer, 
  isCurrentPlayer,
  mustPickUpPileOrPlayThree
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const sameRankCount = pile.length > 0 
    ? pile.filter(card => card.rank === topCard?.rank).length
    : 0;
  
  const isThreeOnTop = topCard?.rank === '3';
  const isTenOnTop = topCard?.rank === '10';
  
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        playerId: 'current-player-id', // Replace with actual player ID
        playerName: 'You', // We'll show "You" for the current player
        message: chatMessage.trim(),
        timestamp: new Date()
      };
      
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Add a few sample messages for demo purpose
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          playerId: 'player1',
          playerName: 'Player 1',
          message: 'Good luck everyone!',
          timestamp: new Date(Date.now() - 1000 * 60 * 5)
        },
        {
          playerId: 'player2',
          playerName: 'Player 2',
          message: 'Thanks, you too!',
          timestamp: new Date(Date.now() - 1000 * 60 * 4)
        }
      ]);
    }
  }, []);
  
  return (
    <div className="w-full max-w-2xl p-6 bg-karma-muted/30 backdrop-blur-sm rounded-xl border border-karma-border shadow-sm relative">
      <div className="flex justify-center items-center mb-4">
        <span className="px-3 py-1 bg-karma-secondary/50 rounded-full text-xs">
          Current Player: <strong>{currentPlayer}</strong>
        </span>
      </div>
      
      <div className="flex justify-center gap-16 items-center min-h-24">
        <div className="relative">
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-karma-secondary/70 text-karma-foreground px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
            {deckCount} card{deckCount !== 1 ? 's' : ''} left
          </div>
          
          {deckCount > 0 && (
            <div className="relative">
              {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(deckCount / 5))) }).map((_, index) => (
                <div 
                  key={`deck-card-${index}`}
                  className="absolute w-16 h-20 bg-karma-card-back bg-card-texture rounded-lg border border-gray-800/20 shadow-md"
                  style={{ 
                    top: `${-index * 0.5}px`, 
                    left: `${-index * 0.5}px`, 
                    transform: `rotate(${(index - 2) * 0.5}deg)`,
                    zIndex: 5 - index
                  }}
                />
              ))}
            </div>
          )}
          
          {deckCount === 0 && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Empty</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="mb-2 text-xs text-karma-foreground/70">
              {sameRankCount > 1 && <span className="font-medium">({sameRankCount})</span>}
              {isTenOnTop && (
                <span className="ml-1 font-medium text-orange-500 flex items-center">
                  <Flame className="h-3 w-3 mr-1" /> Burned
                </span>
              )}
            </div>
            
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-karma-secondary/70 text-karma-foreground px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
              {pile.length} card{pile.length !== 1 ? 's' : ''} discarded
            </div>
            
            {topCard ? (
              <div className="relative">
                {sameRankCount > 1 && (
                  Array.from({ length: Math.min(3, sameRankCount - 1) }).map((_, index) => (
                    <div 
                      key={`pile-card-${index}`}
                      className="absolute w-16 h-20 bg-white rounded-lg border border-gray-200 shadow-md flex items-center justify-center"
                      style={{ 
                        top: `${-3 - index * 2}px`, 
                        left: `${-3 - index * 2}px`, 
                        transform: `rotate(${(index - 1) * -3}deg)`,
                        zIndex: 3 - index
                      }}
                    >
                      <div className={`text-2xl ${topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                        {topCard.rank}
                        <span className="text-lg">
                          {topCard.suit === 'hearts' ? '♥' : 
                          topCard.suit === 'diamonds' ? '♦' : 
                          topCard.suit === 'clubs' ? '♣' : '♠'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                
                <div className={`w-16 h-20 bg-white rounded-lg border border-gray-200 shadow-md flex items-center justify-center ${isTenOnTop ? 'ring-2 ring-orange-500' : ''}`}>
                  <div className={`text-2xl ${topCard.suit === 'hearts' || topCard.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                    {topCard.rank}
                    <span className="text-lg">
                      {topCard.suit === 'hearts' ? '♥' : 
                      topCard.suit === 'diamonds' ? '♦' : 
                      topCard.suit === 'clubs' ? '♣' : '♠'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-16 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Empty</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-6 gap-3">
        {isCurrentPlayer && (
          <Button
            variant={mustPickUpPileOrPlayThree ? "destructive" : "secondary"}
            size="sm"
            onClick={onPickupPile}
            disabled={pile.length === 0}
          >
            <HandMetal className="mr-2 h-4 w-4" />
            Pick Up Pile
          </Button>
        )}
        
        {/* For smaller screens - use a drawer */}
        <div className="md:hidden">
          <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                Chat ({chatMessages.length})
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[70vh] p-4">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Game Chat</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg max-w-[85%]",
                        msg.playerName === "You"
                          ? "bg-karma-primary/10 ml-auto"
                          : "bg-karma-secondary/10"
                      )}
                    >
                      <div className="font-medium text-xs mb-1">
                        {msg.playerName}
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      <div className="text-xs text-karma-foreground/50 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="sm"
                    disabled={!chatMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        
        {/* For larger screens - use a dialog */}
        <div className="hidden md:block">
          <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                Chat ({chatMessages.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <div className="flex flex-col h-[50vh]">
                <h3 className="font-semibold mb-4">Game Chat</h3>
                
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg max-w-[85%]",
                        msg.playerName === "You"
                          ? "bg-karma-primary/10 ml-auto"
                          : "bg-karma-secondary/10"
                      )}
                    >
                      <div className="font-medium text-xs mb-1">
                        {msg.playerName}
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      <div className="text-xs text-karma-foreground/50 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="sm"
                    disabled={!chatMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="text-center mt-4 text-xs text-karma-foreground/70">
        {isThreeOnTop && (
          <p className="font-medium text-orange-600 mb-1">Three has been played! {isCurrentPlayer ? "You must" : "Current player must"} pick up the pile or play another 3. Any 3s will be removed from the pile when picked up.</p>
        )}
        {isTenOnTop && (
          <p className="font-medium text-orange-500 mb-1">10 has been played! The entire discard pile has been completely emptied!</p>
        )}
        <p>Remember: 2, 3, 7, 8, 10 can be played on any card. 7s force the next player to play a card of rank 7 or lower! 10s completely clear the discard pile and give you another turn.</p>
      </div>
    </div>
  );
};

export default GameTable;
