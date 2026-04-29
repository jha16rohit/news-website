import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Trash2, ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from "lucide-react"; 
import "./FooterManagement.css";

// Interface for our background images
interface FooterImage {
  id: string;
  url: string;
  name: string;
  resolution: string;
  isActive: boolean;
}

const INITIAL_IMAGES: FooterImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1920",
    name: "chhath_background.jpg",
    resolution: "1920 x 1080",
    isActive: true,
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1514222709107-a180c68d72b4?auto=format&fit=crop&q=80&w=1920",
    name: "diwali_background.jpg",
    resolution: "1920 x 1080",
    isActive: false,
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1555462010-854bdce1666e?auto=format&fit=crop&q=80&w=1920",
    name: "holi_background.jpg",
    resolution: "1920 x 1080",
    isActive: false,
  },
];

const FooterManagement: React.FC = () => {
  // Text States
  const [sectionTitle, setSectionTitle] = useState("STAY UPDATED");
  const [descriptionText, setDescriptionText] = useState("Get the latest headlines and in-depth stories delivered to your inbox.");
  const [trustedText, setTrustedText] = useState("Your trusted source for real-time news and in-depth stories from India and around the world.");
  
  // Image States
  const [images, setImages] = useState<FooterImage[]>(INITIAL_IMAGES);
  
  // Toast Notification State
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ 
    visible: false, message: '', type: 'success' 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("localNewzFooterData");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setSectionTitle(parsed.sectionTitle);
        setDescriptionText(parsed.descriptionText);
        setTrustedText(parsed.trustedText);
        if (parsed.images) setImages(parsed.images);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: FooterImage = {
          id: Date.now().toString() + Math.random().toString(),
          url: reader.result as string,
          name: file.name,
          resolution: "1920 x 1080",
          isActive: false, // Uploads start as inactive now so you can choose when to use them
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 👇 FIX: Now you can properly DE-ACTIVATE an image!
  const handleToggleActive = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        // If clicking the current one, toggle it on/off. If clicking a different one, turn it off.
        isActive: img.id === id ? !img.isActive : false, 
      }))
    );
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => {
      return prev.filter((img) => img.id !== id);
      // Removed the code that forced another image to turn on automatically
    });
  };

  const handleNameChange = (id: string, newName: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, name: newName } : img)));
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleSave = () => {
    const footerData = { sectionTitle, descriptionText, trustedText, images };
    
    try {
      localStorage.setItem("localNewzFooterData", JSON.stringify(footerData));
      window.dispatchEvent(new Event("localNewzFooterUpdate"));
      showToast("Footer settings saved successfully!", "success");
    } catch (error) {
      showToast("Images too large! Delete the largest image and try again.", "error");
    }
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // 👇 FIX: activeImage will now be undefined if all switches are turned off
  const activeImage = images.find((img) => img.isActive);

  return (
    <div className="fm-page">
      
      {toast.visible && (
        <div className={`fm-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="fm-header">
        <h2>Footer Management</h2>
      </div>

      <div className="fm-content">
        <div className="fm-top-row">
          
          <div className="fm-card fm-inputs-card">
            <h3 className="fm-card-title">Stay Updated Section</h3>
            
            <div className="fm-form-group">
              <label>Section Title</label>
              <input 
                type="text" 
                value={sectionTitle} 
                onChange={(e) => setSectionTitle(e.target.value)} 
                className="fm-input"
              />
            </div>

            <div className="fm-form-group">
              <label>Description Text</label>
              <textarea 
                value={descriptionText} 
                onChange={(e) => setDescriptionText(e.target.value)} 
                className="fm-textarea"
              />
            </div>

            <div className="fm-form-group">
              <label>Trusted Source Text</label>
              <textarea 
                value={trustedText} 
                onChange={(e) => setTrustedText(e.target.value)} 
                className="fm-textarea"
              />
            </div>
          </div>

          <div className="fm-card fm-preview-card">
            <h3 className="fm-card-title">Preview</h3>
            <div 
              className="fm-preview-window" 
              style={{ 
                backgroundImage: activeImage ? `url(${activeImage.url})` : 'none',
                backgroundColor: activeImage ? 'transparent' : '#101e36' // 👇 FIX: Uses your custom color if no image is active!
              }}
            >
              <div className="fm-preview-overlay">
                <div className="fm-preview-banner">
                  <div className="fm-preview-left">
                    <div className="fm-preview-title-wrap">
                      <span className="fm-red-dot"></span>
                      <span className="fm-preview-title">{sectionTitle}</span>
                    </div>
                    <div className="fm-preview-divider"></div>
                    <span className="fm-preview-desc">{descriptionText}</span>
                  </div>
                  
                  <div className="fm-preview-right">
                    <div className="fm-preview-input-group">
                      <input type="text" placeholder="Enter your email" disabled />
                      <span className="fm-mail-icon">✉</span>
                    </div>
                    <button className="fm-preview-btn">Subscribe</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fm-card fm-gallery-card">
          <h3 className="fm-card-title">Footer Background Images</h3>
          
          <div className="fm-gallery-container">
            <div className="fm-upload-box" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={32} className="fm-upload-icon" />
              <p className="fm-upload-text">Click to upload or drag and drop</p>
              <p className="fm-upload-subtext">Recommended: 1920 x 1080 px (JPG, PNG)</p>
              <button className="fm-upload-btn">Choose Files</button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                multiple 
                hidden 
              />
            </div>

            <div className="fm-gallery-wrapper">
              <button className="fm-scroll-btn left" onClick={() => scrollGallery('left')}>
                <ChevronLeft size={20} />
              </button>
              
              <div className="fm-image-list" ref={scrollRef}>
                {images.map((img) => (
                  <div key={img.id} className={`fm-image-card ${img.isActive ? 'active' : ''}`}>
                    <div className="fm-img-wrapper">
                      <img src={img.url} alt={img.name} />
                      {img.isActive && <span className="fm-active-badge">Active</span>}
                    </div>
                    
                    <div className="fm-img-details">
                      <input 
                        type="text" 
                        value={img.name} 
                        onChange={(e) => handleNameChange(img.id, e.target.value)}
                        className="fm-img-name-input"
                      />
                      
                      <div className="fm-img-controls">
                        <span className="fm-img-res">{img.resolution}</span>
                        <div className="fm-img-actions">
                          <label className="fm-toggle">
                            <input 
                              type="checkbox" 
                              checked={img.isActive} 
                              onChange={() => handleToggleActive(img.id)} 
                            />
                            <span className="fm-slider"></span>
                          </label>
                          <button className="fm-delete-btn" onClick={() => handleDeleteImage(img.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="fm-scroll-btn right" onClick={() => scrollGallery('right')}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <p className="fm-upload-hint">You can upload multiple images for different occasions. Turn off all switches to use the solid blue background.</p>
        </div>

        <div className="fm-actions">
          <button className="fm-btn-cancel">Cancel</button>
          <button className="fm-btn-save" onClick={handleSave}>Save Changes</button>
        </div>

      </div>
    </div>
  );
};

export default FooterManagement;