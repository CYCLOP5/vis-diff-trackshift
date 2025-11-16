
import React, { memo, useState, useEffect } from 'react';
import { ImageFile, AppMode, ForesightResult } from '../types';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { XCircleIcon } from './Icons';

const CarouselImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        setIsLoaded(false);
    }, [src]);

    return (
        <div className="relative w-full h-full bg-gray-200 dark:bg-f1-dark">
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gray-300 dark:bg-gray-800 animate-pulse"
                    />
                )}
            </AnimatePresence>
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                style={{ opacity: isLoaded ? 1 : 0 }}
                onLoad={() => setIsLoaded(true)}
            />
        </div>
    );
};


interface TimelineCarouselProps {
    images: ImageFile[];
    appMode: AppMode;
    foresightResult: ForesightResult | null;
    onReorder: (newOrder: ImageFile[]) => void;
    onRemove?: (id: string) => void;
}

const TimelineCarousel: React.FC<TimelineCarouselProps> = ({ images, appMode, foresightResult, onReorder, onRemove }) => {
    const getLabel = (index: number, total: number): string => {
        if (appMode === AppMode.DELTA_ANALYSIS) {
            return index === 0 ? 'Before' : 'Reality (Yours)';
        }
        if (appMode === AppMode.FORESIGHT_REALITY_INPUT) {
            return 'Before';
        }
        if (total === 1) return 'Current State';
        if (index === 0) return 'Before';
        if (index === total - 1) return 'After';
        return `Step ${index + 1}`;
    };

    // A non-reorderable component for the prophecy image
    const ProphecyImage: React.FC<{ src: string; label: string; index: number }> = ({ src, label, index }) => (
       <motion.div
           key={label + index}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: index * 0.1 }}
           className="flex-shrink-0 w-32 sm:w-48 text-center group"
       >
           <div className="relative aspect-video bg-f1-light dark:bg-f1-dark rounded-md overflow-hidden ring-2 ring-f1-accent-magenta/50 transition-all shadow-lg shadow-f1-accent-magenta/10">
               <CarouselImage src={src} alt={label} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               <div className="absolute bottom-0 left-0 right-0 text-white text-xs font-bold py-1 bg-f1-accent-magenta text-center">
                   {label}
               </div>
           </div>
       </motion.div>
    );

  return (
    <div className="bg-f1-light-brighter/80 dark:bg-f1-light-dark/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-gray-700/50">
      <h3 className="text-sm font-semibold text-f1-text-darker-light dark:text-f1-text-darker mb-3 uppercase tracking-wider">
        {appMode === AppMode.FORESIGHT_REALITY_INPUT ? 'Timeline: Prophecy vs. Reality' : 'Image Timeline (Drag to reorder)'}
      </h3>
    <div className="flex items-center space-x-4 overflow-x-auto pb-2 -mb-2 custom-scrollbar">
        <Reorder.Group as="div" axis="x" values={images} onReorder={onReorder} className="flex space-x-4">
            {images.map((image, index) => {
                const label = getLabel(index, images.length);
                return (
                    <Reorder.Item
                        key={image.id}
                        value={image}
                        className="flex-shrink-0 w-32 sm:w-48 text-center relative cursor-grab active:cursor-grabbing group"
                        whileDrag={{ scale: 1.05, zIndex: 10, boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' }}
                        transition={{ duration: 0.2 }}
                    >
                                                <div className="relative aspect-video bg-f1-light dark:bg-f1-dark rounded-md overflow-hidden ring-2 ring-gray-300 dark:ring-gray-700 group-hover:ring-f1-accent-cyan transition-all">
                            <CarouselImage src={image.previewUrl} alt={label} />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white text-xs font-semibold py-1 bg-black/50 text-center">
                                {label}
                            </div>
                                                        {onRemove && (
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    onRemove(image.id);
                                                                }}
                                                                className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1 opacity-80 hover:opacity-100 transition"
                                                                aria-label={`Remove ${label}`}
                                                            >
                                                                <XCircleIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                        </div>
                    </Reorder.Item>
                );
            })}
        </Reorder.Group>
        {appMode !== AppMode.STANDARD_ANALYSIS && foresightResult && (
            <ProphecyImage src={foresightResult.prophecyImageUrl} label="AI Prophecy" index={images.length} />
        )}
      </div>
    </div>
  );
};

export default memo(TimelineCarousel);