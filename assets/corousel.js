let UploadFile = document.getElementById("FileContent");

UploadFile.addEventListener("change", () => {
    document.getElementById("carouselExample").style.display="block";
    document.getElementById("NoMedia").style.display="none";
    window.location.href="#carouselExample"
    const carouselInner = document.getElementById("active");
    carouselInner.innerHTML = ''; // Clear previous items
      
    const Images = Array.from(UploadFile.files);
    
    Images.forEach((image, index) => {
        const reader = new FileReader();
     
        reader.onload = (e) => {
            const div = document.createElement("div");
            div.className = "carousel-item";
            if (index === 0) div.classList.add("active"); // First image is active
      
            const Pic = document.createElement("img");
            Pic.src = e.target.result;
            Pic.className = "d-block w-100";
    
            div.appendChild(Pic);
            carouselInner.appendChild(div);
        };
     
        reader.readAsDataURL(image);
    });
});
