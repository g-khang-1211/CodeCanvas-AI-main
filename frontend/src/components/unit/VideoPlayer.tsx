import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Video } from '../../types';

interface VideoPlayerProps {
  video: Video;
}

export const VideoPlayer = ({ video }: VideoPlayerProps) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVideo = async () => {
      try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.videoId}&format=json`);
        setIsValid(response.ok);
      } catch {
        setIsValid(false);
      }
    };

    checkVideo();
  }, [video.videoId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
      <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative">
        {isValid === null ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isValid === false ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800/50">
            <AlertTriangle className="text-red-500 mb-2" size={32} />
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">This video is no longer available or is private.</p>
          </div>
        ) : (
          <iframe
            className="w-full h-full absolute inset-0"
            src={`https://www.youtube.com/embed/${video.videoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{video.title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">{video.description}</p>
      </div>
    </div>
  );
};
