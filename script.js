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
  const audio = new Audio();
  audio.preload = 'metadata';

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

  selectTrack(0, false);
});
