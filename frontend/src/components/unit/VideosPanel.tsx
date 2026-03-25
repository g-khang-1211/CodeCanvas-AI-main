import { Video } from '../../types';
import { VideoPlayer } from './VideoPlayer';

interface VideosPanelProps {
  loadingVideos: boolean;
  videos: Video[];
}

export const VideosPanel = ({ loadingVideos, videos }: VideosPanelProps) => {
  if (loadingVideos) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Finding best video tutorials...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return <div className="text-center text-gray-500 py-20">No videos found for this topic.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {videos.map((video, index) => (
        <VideoPlayer key={index} video={video} />
      ))}
    </div>
  );
};
