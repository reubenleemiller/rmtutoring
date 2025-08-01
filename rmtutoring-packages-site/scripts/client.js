const stripe = Stripe("pk_live_51RjQESAKt4hvfywU0wcOUsAUYaTOYA98ztLNHXoh5KaYUJB10CpqYrkSzrZjnqCJAwEg1ZIcUWpiF5wyWcS1j2cM00boLcFHXC");

const subscriptionLinks = {
  "4hr": "https://buy.rmtutoringservices.com/b/aFabJ0ab1aQ7b5U6O75Rm03",
  "8hr": "https://buy.rmtutoringservices.com/b/dRm6oG1Ev2jBa1Q7Sb5Rm04",
  "12hr": "https://buy.rmtutoringservices.com/b/28E28q4QH7DV3DsfkD5Rm05"
};

let selectedPackage = "8hr";
let currentIndex = 1;

document.addEventListener("DOMContentLoaded", () => {
  const pricingCards = document.querySelectorAll(".pricing-card");
  const submitButton = document.querySelector("#submit");
  const dotContainer = document.querySelector("#carousel-dots");
  const leftArrow = document.querySelector(".carousel-arrow.left");
  const rightArrow = document.querySelector(".carousel-arrow.right");
  const carousel = document.querySelector(".pricing-carousel");

  function updateActiveDot(index) {
    document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  function createDots() {
    dotContainer.innerHTML = "";
    pricingCards.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.classList.add("carousel-dot");
      if (i === currentIndex) dot.classList.add("active");

      // Make dot clickable to select card
      dot.addEventListener("click", () => {
        selectCard(i);
      });

      dotContainer.appendChild(dot);
    });
  }

  function scrollToCard(index, smooth = true) {
    const card = pricingCards[index];
    if (!card || !carousel) return;

    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const carouselCenter = carousel.offsetWidth / 2;
    const scrollLeft = cardCenter - carouselCenter;

    carousel.scrollTo({
      left: scrollLeft,
      behavior: smooth ? "smooth" : "auto"
    });

    updateActiveDot(index);
    currentIndex = index;
  }

  function selectCard(index) {
    pricingCards.forEach((card, i) => {
      card.classList.toggle("selected", i === index);
      const checkbox = card.querySelector("input[type='checkbox']");
      if (checkbox && i !== index) checkbox.checked = false;
    });

    selectedPackage = pricingCards[index].dataset.package;
    scrollToCard(index);
  }

  pricingCards.forEach((card, index) => {
    // Click handler on select button
    const selectBtn = card.querySelector(".select-btn");
    if (selectBtn) {
      selectBtn.addEventListener("click", (e) => {
        e.stopPropagation();  // Prevent card click double fire
        selectCard(index);
      });
    }

    // Make the whole card clickable
    card.addEventListener("click", () => {
      selectCard(index);
    });
  });

  if (leftArrow && rightArrow) {
    leftArrow.addEventListener("click", () => {
      if (currentIndex > 0) {
        selectCard(currentIndex - 1);
      }
    });

    rightArrow.addEventListener("click", () => {
      if (currentIndex < pricingCards.length - 1) {
        selectCard(currentIndex + 1);
      }
    });
  }

  if (carousel) {
    carousel.addEventListener("scroll", () => {
      const center = carousel.scrollLeft + carousel.offsetWidth / 2;
      let closest = 0;
      let minDiff = Infinity;

      pricingCards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const diff = Math.abs(center - cardCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      });

      currentIndex = closest;
      updateActiveDot(currentIndex);
    });

    function waitForPreloaderThenScroll() {
      const selectedCard = document.querySelector(".pricing-card.selected");
      const carousel = document.querySelector(".pricing-carousel");

      if (!selectedCard || !carousel) return;

      const cardCenter = selectedCard.offsetLeft + selectedCard.offsetWidth / 2;
      const carouselCenter = carousel.offsetWidth / 2;
      const scrollLeft = cardCenter - carouselCenter;

      if (document.documentElement.classList.contains('preloader-lock') || carousel.offsetWidth === 0) {
        requestAnimationFrame(waitForPreloaderThenScroll);
      } else {
        carousel.scrollLeft = scrollLeft;
      }
    }

    window.addEventListener("load", () => {
      requestAnimationFrame(waitForPreloaderThenScroll);
    });
  }

  createDots();

  if (submitButton) {
    submitButton.addEventListener("click", async e => {
      e.preventDefault();
      submitButton.disabled = true;

      const selectedCard = document.querySelector(".pricing-card.selected");
      const subscribe = selectedCard?.querySelector("input[type='checkbox']")?.checked;
      const pkg = selectedCard?.dataset.package;

      if (!pkg) {
        document.querySelector("#error-message").textContent = "Please select a package.";
        submitButton.disabled = false;
        return;
      }

      if (subscribe && subscriptionLinks[pkg]) {
        window.location.href = subscriptionLinks[pkg];
      } else {
        window.location.href = `./pages/checkout.html?package=${pkg}`;
      }
    });
  }
});
