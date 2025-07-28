import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './icons';

export const AccordionSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, icon, children, isOpen, onToggle }) => {
    const [isOverflowVisible, setIsOverflowVisible] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // This effect handles setting overflow to visible *after* the opening animation.
    useEffect(() => {
        const node = contentRef.current;
        if (!node) return;

        const handleTransitionEnd = () => {
            // Only set overflow to visible if the accordion is open.
            if (isOpen) {
                setIsOverflowVisible(true);
            }
        };

        node.addEventListener('transitionend', handleTransitionEnd);
        return () => {
            node.removeEventListener('transitionend', handleTransitionEnd);
        };
    }, [isOpen]);

    // This effect handles hiding overflow *before* the closing animation.
    useEffect(() => {
        if (!isOpen) {
            setIsOverflowVisible(false);
        }
    }, [isOpen]);

    return (
        <div className="border border-brand-accent/50 rounded-lg bg-brand-primary/40 transition-all duration-300">
            <button
                className="w-full flex justify-between items-center p-3 text-left text-brand-text font-semibold hover:bg-brand-accent/30 transition-colors"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span>{title}</span>
                </div>
                <ChevronDownIcon className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                ref={contentRef}
                className={`accordion-content ${isOpen ? 'open' : ''} ${isOverflowVisible ? 'overflow-visible' : ''}`}
            >
                 <div className="p-4 border-t border-brand-accent/50 space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
