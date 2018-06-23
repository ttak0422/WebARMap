import main, { init } from './modules/main'

THREEAR.ARUtils.getARDisplay().then(function (display) {
    if (display) {
        init();
    } else {        
        THREEAR.ARUtils.displayUnsupportedMessage();
    }
});