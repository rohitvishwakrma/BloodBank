const slider = document.querySelector('.slider');
const images = document.querySelectorAll('.slider img');
const totalImages = images.length;
const dotContainer = document.querySelector('.dot-container');
let currentIndex = 0;
let sliderWidth = 100 * totalImages; 

slider.style.width = `${sliderWidth}%`; 


for (let i = 0; i < totalImages; i++) {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    dot.dataset.index = i; 
    dotContainer.appendChild(dot);
}

const dots = document.querySelectorAll('.dot');


function moveSlider() {
    slider.style.transform = `translateX(-${(100 / totalImages) * currentIndex}%)`;
   
    dots.forEach(dot => dot.classList.remove('active'));
    dots[currentIndex].classList.add('active');
    slider.style.opacity='1';
}


function nextSlide() {
    currentIndex++;
    if (currentIndex >= totalImages) {
        currentIndex = 0; 
        slider.style.opacity='0';
    moveSlider();
}
}

function prevSlide() {
    currentIndex--;
    if (currentIndex < 0) {
        currentIndex = totalImages - 1; 
    }
    moveSlider();
}


setInterval(nextSlide, 6000);


dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
        currentIndex = parseInt(e.target.dataset.index);
        moveSlider();
    });
});


moveSlider()