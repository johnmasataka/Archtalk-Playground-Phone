import React from 'react';
import useStore from '../store';

function SlideSelector() {
    const { availableSlides, selectedValues, handleSlideSelection } = useStore();

    const handleOptionClick = (slideKey, optionValue) => {
        handleSlideSelection(slideKey, optionValue);
    };

    return (
        <>
            {availableSlides.map((slide) => (
                <div key={slide.key} className="slide">
                    <h3>{slide.title}</h3>
                    <div className="options">
                        {slide.options.map((option) => (
                            <button
                                key={option.value}
                                className={selectedValues[slide.key] === option.value ? 'selected' : ''}
                                onClick={() => handleOptionClick(slide.key, option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}

export default SlideSelector; 