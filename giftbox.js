// ── GIFTBOX SCRIPT ──
// Box opens ONLY when the user taps/clicks it.
// After the lid flies off and the star rises, star becomes tappable.

window.addEventListener('DOMContentLoaded', function () {
  var giftSection = document.getElementById('giftSection');
  var presentBox  = document.getElementById('presentBox');
  var tapHint     = document.getElementById('tapHint');
  var giftStar    = document.getElementById('giftStar');

  giftSection.style.cursor = 'pointer';

  giftSection.addEventListener('click', function openBox() {
    giftSection.removeEventListener('click', openBox);
    giftSection.style.cursor = 'default';

    if (tapHint) {
      tapHint.style.transition = 'opacity 0.4s ease';
      tapHint.style.opacity    = '0';
    }

    presentBox.classList.add('open');

    setTimeout(function () {
      makeStarTappable(giftStar, giftSection);
    }, 5000);
  });
});

function makeStarTappable(giftStar, giftSection) {
  giftStar.style.cursor        = 'pointer';
  giftStar.style.pointerEvents = 'auto';

  giftStar.addEventListener('click', function onStarClick() {
    giftStar.removeEventListener('click', onStarClick);
    giftStar.style.pointerEvents = 'none';

    giftSection.style.transition = 'opacity 0.5s ease';
    giftSection.style.opacity    = '0';

    setTimeout(function () {
      giftSection.style.display = 'none';

      var bdaySection = document.getElementById('birthdaySection');
      bdaySection.style.display = 'flex';

      setTimeout(function () {
        var originalStar = document.getElementById('star');
        if (originalStar && originalStar.click) {
          originalStar.click();
        }
      }, 200);
    }, 500);
  });
}
