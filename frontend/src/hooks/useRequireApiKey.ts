import { useApp } from '../context/AppContext';

export const useRequireApiKey = () => {
  const { userApiKey, setShowSettings } = useApp();

  return () => {
    if (userApiKey) {
      return userApiKey;
    }

    alert('Error: No API Key. Please add your API key in settings.');
    setShowSettings(true);
    return '';
  };
};
