import { useApp } from '../context/AppContext';

export const useRequireApiKey = () => {
  const { hasApiKey, hasLoadedKeyStatus, setShowSettings } = useApp();

  return () => {
    if (hasApiKey) {
      return 'backend-managed';
    }

    if (!hasLoadedKeyStatus) {
      alert('Error: Unable to verify your saved API key right now. Please try again in a moment.');
      return '';
    }

    alert('Error: No API Key. Please add your API key in settings.');
    setShowSettings(true);
    return '';
  };
};
