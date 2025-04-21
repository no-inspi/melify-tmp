'use client';

import './style.css';

import React, { useState, useEffect, useContext, createContext } from 'react';

// import { useRouter } from 'src/routes/hooks';

import { Dialog, DialogContent } from 'src/s/components/ui/dialog.tsx';
import {
  Carousel,
  CarouselItem,
  CarouselNext,
  CarouselContent,
  CarouselPrevious,
} from 'src/s/components/ui/carousel.tsx';

const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
  const [api, setApi] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [orbImageGif, setOrbImageGif] = useState('level1orb.gif');
  const [userInteractions, setUserInteractions] = useState([
    {
      toastMessage: 'First task done. Is this the start of your productivity era?',
      badgeName: 'Inbox Explorer',
      badgeDetails: {
        hex: '',
      },
      type: 'level',
      levelNumber: '1',
    },
  ]);

  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // const router = useRouter();

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const showDialog = (userInteractionsNotifications, orbImage) => {
    setUserInteractions([userInteractionsNotifications]);
    setOrbImageGif(orbImage);
    setIsOpen(true);
  };

  const hideDialog = () => {
    setIsOpen(false);
  };

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="bg-transparent rounded-lg w-[600px] h-auto p-0 border-0"
          style={{
            borderRadius: '10px',
            overflow: 'hidden', // Ensure proper rendering
          }}
        >
          <div className="mx-auto max-w-xs">
            <Carousel setApi={setApi} className="w-full max-w-xs">
              <CarouselContent>
                {userInteractions.map((userInteraction, index) => (
                  <CarouselItem key={index}>
                    <div className="card-achievment bg-[hsl(var(--background))]">
                      <div className="clash-card__image clash-card__image--barbarian">
                        <img src={`/assets/images/${orbImageGif}`} alt="barbarian" />
                      </div>
                      <div className="container-card">
                        <div className="level font-bold italic">{userInteraction.badgeName}</div>
                        <div className="title">Level {userInteraction.levelNumber}</div>
                        <div className="description">{userInteraction.toastMessage} </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          <div className="py-2 text-center text-sm text-muted-foreground">
            {current}/{count}
          </div>
          {/* <DialogTitle>{dialogTitle}</DialogTitle>
         <DialogDescription>{dialogDescription}</DialogDescription> */}
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
