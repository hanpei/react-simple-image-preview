import React from 'react';
import ImagePreview from './core/ImageViewContainer';

function App() {
  return (
    <div style={{ width: '800px', height: '600px' }}>
      <ImagePreview imgSrc="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1950"></ImagePreview>
    </div>
  );
}

export default App;
