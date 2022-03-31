export const handleClosePopup = () => {
  //ESC
  document.addEventListener(
    'keydown',
    function (e) {
      if (e.keyCode === 27) {
        logseq.hideMainUI({ restoreEditingCursor: true });
      }
      e.stopPropagation();
    },
    false
  );
};
