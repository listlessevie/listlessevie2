// Notion music player. Audio paths are relative to the page, not the script.
$(function () {
  const $panel = $('#player-track');
  const $disc = $('#album-art');
  const $button = $('#play-pause-button');
  const $icon = $button.find('i');
  const $timeline = $('#seek-bar-container');
  const $progress = $('#seek-bar');
  const $hover = $('#s-hover');
  const $tooltip = $('#seek-time');
  // A video media element can play the same MP3s and supports muted autoplay
  // in browsers that require a click even for a muted Audio element.
  // It is never added to the page, so the player layout stays exactly the same.
  const audio = document.createElement('video');
  audio.playsInline = true;
  audio.preload = 'metadata';
  // Always start silently, before assigning a source or attempting autoplay.
  audio.defaultMuted = true;
  audio.muted = true;

  const $muteButton = $(
    '<button type="button" id="mute-button" aria-label="Unmute" title="Unmute">' +
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M3 9h4l5-4v14l-5-4H3z"/>' +
        '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
          '<path class="sound-off" d="m16 9 6 6m0-6-6 6"/>' +
          '<path class="sound-on" style="display:none" d="M16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>' +
        '</g>' +
      '</svg>' +
    '</button>'
  ).appendTo('#player-content');

  // Only style the new control; leave the existing player design untouched.
  $('<style>').text(
'#mute-button {position:absolute;left:6px;bottom:4px;z-index:3;' +
      'display:flex;align-items:center;justify-content:center;' +
      'width:24px;height:24px;padding:0;border:0;border-radius:4px;' +
      'background:transparent;color:#d6dee7;cursor:pointer;' +
      'transition:0.2s ease background-color,0.2s ease color;}' +
    '#mute-button svg {display:block;}' +
    '#mute-button:hover {background-color:#d6d6de;color:#fff;}' +
    '#mute-button:focus-visible {outline:2px solid #d6dee7;outline-offset:2px;}'
  ).appendTo('head');

  function updateMuteButton() {
    const label = audio.muted ? 'Unmute' : 'Mute';
    $muteButton.attr({ 'aria-label': label, title: label });
    $muteButton.find('.sound-off').toggle(audio.muted);
    $muteButton.find('.sound-on').toggle(!audio.muted);
  }

  $muteButton.on('click', function () {
    audio.muted = !audio.muted;
    updateMuteButton();
    // A direct click can start playback if the initial autoplay was blocked.
    if (!audio.muted && audio.paused) play();
  });

  $(audio).on('volumechange', updateMuteButton);
  updateMuteButton();

  let index = 0;
  let playRequest = 0;

  // Reuse Proxy's artwork slot for Puppy Princess.
  // The other four songs keep their original artwork.
  const record = 'https://merch.ambientinks.com/cdn/shop/files/HF-LP-RedBeerVariant-SideA.png?v=1752258366';
  $disc.find('#_5').attr({ src: record, alt: 'Hot Freaks vinyl record' });

  // Fill the existing circle and show the vinyl's own center hole.
  $('<style>').text(
    '#album-art #_5 {width:138%;height:138%;left:-19%;top:-19%;}' +
    '#album-art.puppy-record::before {display:none;}'
  ).appendTo('head');

  const demo = 'https://singhimalaya.github.io/Codepen/assets/music/';

  // Each row is [bold title, subtitle, audio file, artwork ID].
  const tracks = [
    ['Puppy Princess', 'Hot Freaks', 'assets/music/puppy%20princess.mp3', '_5'],
    ['NILFRUITS - Wozwald', 'NOMAN', 'assets/music/wozwald.mp3', '_1'],
    ['Dawn', 'Skylike - Dawn', demo + '2.mp3', '_2'],
    ['Electro Boy', 'Kaaze - Electro Boy', demo + '3.mp3', '_3'],
    ['Home', 'Jordan Schor - Home', demo + '4.mp3', '_4']
  ];

  function timeLabel(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const n = Math.floor(seconds);
    return String(Math.floor(n / 60)).padStart(2, '0') + ':' +
      String(n % 60).padStart(2, '0');
  }

  function showPlaying(playing) {
    $panel.toggleClass('active', playing);
    $disc.toggleClass('active', playing);
    $icon.attr('class', playing ? 'fas fa-pause' : 'fas fa-play');
    if (!playing) $disc.removeClass('buffering');
  }

  function updateTime() {
    const duration = audio.duration;
    const known = Number.isFinite(duration) && duration > 0;
    $('#current-time').text(timeLabel(audio.currentTime));
    $('#track-length').text(timeLabel(duration));
    $('#track-time').toggleClass('active', known);
    $progress.width((known ? 100 * audio.currentTime / duration : 0) + '%');
  }

  function play() {
    const request = ++playRequest;
    const pending = audio.play();
    if (pending && pending.catch) {
      pending.catch(function (error) {
        if (request !== playRequest || error.name === 'AbortError') return;
        showPlaying(false);
        console.warn('Could not play ' + tracks[index][2], error);
      });
    }
  }

  function selectTrack(next, startPlaying) {
    if (next < 0 || next >= tracks.length) return;
    ++playRequest;
    index = next;
    audio.pause();

    const [title, subtitle, src, artId] = tracks[index];
    $('#album-name').text(title);
    $('#track-name').text(subtitle);
    $disc.find('img.active').removeClass('active');
    $disc.find('#' + artId).addClass('active');
    $disc.toggleClass('puppy-record', index === 0);

    showPlaying(false);
    audio.src = src;
    $('#current-time, #track-length').text('00:00');
    $('#track-time').removeClass('active');
    $progress.width(0);

    if (startPlaying) play();
  }

  function fraction(event) {
    const rect = $timeline[0].getBoundingClientRect();
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / (rect.width || 1)));
  }

  function hideHover() {
    $hover.width(0);
    $tooltip.hide();
  }

  $button.on('click', function () {
    if (audio.paused || audio.ended) {
      play();
    } else {
      ++playRequest;
      audio.pause();
    }
  });

  $('#play-previous').on('click', function () {
    selectTrack(index - 1, true);
  });

  $('#play-next').on('click', function () {
    selectTrack(index + 1, true);
  });

  $timeline.on('mousemove', function (event) {
    const f = fraction(event);
    $hover.width((100 * f) + '%');
    $tooltip.text(Number.isFinite(audio.duration) ? timeLabel(f * audio.duration) : '--:--')
      .css({ left: (100 * f) + '%', 'margin-left': '-21px' }).show();
  }).on('mouseout', hideHover).on('click', function (event) {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = fraction(event) * audio.duration;
    }
    hideHover();
  });

  $(audio)
    .on('play', function () {
      showPlaying(!audio.paused);
    })
    .on('playing canplay', function () {
      $disc.removeClass('buffering');
    })
    .on('waiting', function () {
      if (!audio.paused) $disc.addClass('buffering');
    })
    .on('pause', function () {
      if (audio.paused) showPlaying(false);
    })
    .on('timeupdate loadedmetadata durationchange', updateTime)
    .on('ended', function () {
      showPlaying(false);
      $progress.width(0);
      $('#current-time').text('00:00');
    })
    .on('error', function () {
      showPlaying(false);
      console.warn('Check the audio file path:', tracks[index][2]);
    });

  selectTrack(0, true);
});
