// Hooks extraídos desde UserDashboard para reducir complejidad ciclomática
import { useEffect, useState } from 'react';

const SECTION_ID_TO_TAB = {
  'all-content-section': 'all',
  'creators-section': 'creators',
  'video-section': 'video',
  'audio-section': 'audio'
};

export function useScrollInfo() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      setScrollProgress(documentHeight > 0 ? (y / documentHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return { scrolled, scrollProgress };
}

export function useActiveTabObserver(setActiveTab) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const tab = SECTION_ID_TO_TAB[entry.target.id];
          tab && setActiveTab(tab);
        });
      },
      { root: null, rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );
    const sections = document.querySelectorAll('#all-content-section, #creators-section, #video-section, #audio-section');
    sections.forEach(s => observer.observe(s));
    return () => sections.forEach(s => observer.unobserve(s));
  }, [setActiveTab]);
}

export function useAutoHeroRotation(contents, heroContent, playingVideo, setHeroTransition, setCurrentHeroIndex) {
  useEffect(() => {
    if (playingVideo || heroContent || contents.length === 0) return;

    const incrementHeroIndex = () => setCurrentHeroIndex(prev => (prev + 1) % contents.length);
    const endTransition = () => setHeroTransition(false);

    function rotateHero() {
      setHeroTransition(true);
      const idxTimeout = setTimeout(incrementHeroIndex, 800);
      const endTimeout = setTimeout(endTransition, 850);
      return () => { clearTimeout(idxTimeout); clearTimeout(endTimeout); };
    }

    const interval = setInterval(rotateHero, 7000);
    return () => clearInterval(interval);
  }, [contents, heroContent, playingVideo, setHeroTransition, setCurrentHeroIndex]);
}
