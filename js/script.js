/* Pick a section of a song from Soundcloud and loop it
 *
 * @author: Miguel Del Valle <mdelvalle@utexas.edu>
 *
 */

window.onload = function() {
  var searchParams = new URLSearchParams(window.location.href.split("?")[1]);
  var userInput = decodeURI(searchParams.get('inputName'));

  var widget_options =
    userInput +
    '&auto_play=false' +
    '&enable_api=true' +
    '&show_artwork=false';

  var url = 'https://w.soundcloud.com/player/?url=' + widget_options;
  
  var iframe = document.getElementById('soundcloud_widget');
  iframe.src = url || localStorage.getItem('url');
  var widget = SC.Widget(iframe);
  var songDuration = 0;

  // The Soundcloud widget has loaded.
  var widgetReady = new Promise(function(resolve, reject) {

    widget.bind(SC.Widget.Events.READY, function() {
      resolve();
    });
  });

  var startPos = 0;
  var endPos = 0;

  // Initialize nstSlider class attributes
  widgetReady.then(function () {
    var durationReady = new Promise(function(resolve, reject) {
      widget.getDuration(function(dur) {
        songDuration = dur;
        resolve();
      });
    });

    durationReady.then(function() {
      $('.nstSlider')[0].setAttribute('data-range_min', 0);
      $('.nstSlider')[0].setAttribute('data-range_max', songDuration);
      $('.nstSlider')[0].setAttribute('data-cur_min', (searchParams.get('min') || 0));
      $('.nstSlider')[0].setAttribute('data-cur_max', (searchParams.get('max') || songDuration));

      $('.nstSlider').nstSlider({
        'crossable_handles': false,
        'left_grip_selector': '.leftGrip',
        'right_grip_selector': '.rightGrip',
        'value_bar_selector': '.bar',
        'value_changed_callback': function(cause, leftValue, rightValue) {
          widget.seekTo(leftValue);
          startPos = leftValue;
          endPos = rightValue;

          $('.leftLabel').text(msToTime(startPos));
          $('.rightLabel').text(msToTime(endPos));
          
          updateUrl(userInput, startPos, endPos);
        }
      });
    });
  });

  function updateUrl(sc, min, max) {
      var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?inputName=' + encodeURI(sc) + '&min=' + min + '&max=' + max;
      window.history.pushState({path:newurl},'',newurl);
  }
  
  function msToTime(duration) {

    var milliseconds = parseInt((duration%1000)/100)
    var seconds = parseInt((duration/1000)%60)
    var minutes = parseInt((duration/(1000*60))%60)
    var hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    if (hours !== '00') {
      return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    } else {
      return minutes + ":" + seconds + "." + milliseconds;
    }
  }


  // When the Soundcloud widget has started to play
  // seek to the START position
  widget.bind(SC.Widget.Events.PLAY, function() {
    widget.seekTo(startPos);
  });

  // Return to START position when the song reaches
  // the STOP position
  widget.bind(SC.Widget.Events.PLAY_PROGRESS, function(e) {
    var currPos = e.currentPosition;
    if (currPos >= endPos || currPos === songDuration) {
      widget.seekTo(startPos);
      widget.play();
    }
  });
};
