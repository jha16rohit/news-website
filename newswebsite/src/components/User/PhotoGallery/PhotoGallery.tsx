import React from "react";
import { Camera, ArrowRight } from "lucide-react";
import "./PhotoGallery.css";

const PhotoGallery: React.FC = () => {
  // Mock data matching the themes in your image
  const galleryPhotos = [
    {
      id: 1,
      alt: "Parliament in session during the Historic budget vote",
      imgUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1000",
      isLarge: true, // This flag makes it span multiple rows/columns
    },
    {
      id: 2,
      alt: "Person reading newspaper",
      imgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 3,
      alt: "Vintage typewriter",
      imgUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 4,
      alt: "Globe map view",
      imgUrl: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 5,
      alt: "Audience at a conference",
      imgUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 6,
      alt: "Brain anatomy model",
      imgUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 7,
      alt: "Farmers working in a field",
      imgUrl: "https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 8,
      alt: "Busy city traffic at night",
      imgUrl: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 9,
      alt: "Election rally crowd",
      imgUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=600",
    }
  ];

  return (
    <section className="gallery-section">
      <div className="gallery-container">
        
        {/* Header */}
        <div className="gallery-header">
          <div className="gallery-title-wrapper">
            <Camera size={28} className="gallery-icon" strokeWidth={2.5} />
            <h2>Photo Gallery</h2>
            <div className="header-underline"></div>
          </div>
          <a href="#" className="view-all-link">
            View All <ArrowRight size={16} />
          </a>
        </div>

        {/* CSS Grid Layout */}
        <div className="gallery-grid">
          {galleryPhotos.map((photo) => (
            <div 
              key={photo.id} 
              className={`gallery-item ${photo.isLarge ? 'large-item' : ''}`}
            >
              <img src={photo.imgUrl} alt={photo.alt} className="gallery-image" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PhotoGallery;