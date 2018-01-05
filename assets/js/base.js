const {app, BrowserWindow, dialog} = require('electron').remote;

// Filesystem
var fs = require('fs');

var screenshot = require('electron-screenshot-app');

// promts, confirms, etc.
const Dialogs = require('dialogs');
var dialogs   = Dialogs();

// save/load to json
const Config  = require('electron-config');
const config  = new Config();

$(function(){
  var base = {
    targetMarker: {},
    waveID: 0,
    appPath: app.getAppPath(),
    messageCount: 0,
    contextPos: [0,0],
    events: function(){
      $('a[href="#lock"]').on('click',function(e){
        e.preventDefault();
        $('body').toggleClass('locked');
        config.set('locked',$('body').hasClass('locked'));
      });

      $('.search-button').on('click',function(e){
        e.preventDefault();
        base.searchMarker();
      });

      $('.search-input').on('keyup focus',function(e){
        var searchText  = $(this).val();
        var sRegExp = new RegExp(searchText,'gi');

        $('ul.employer-list').hide().html('');
        if(searchText.length > 0){
          $('.marker','.marker-holder').not('.marker-desk').each(function(){
            var mSelf = $(this);
            if($('.info',mSelf).text().match(sRegExp)){
              $('<li>'+$('.info',mSelf).text()+'</li>').appendTo('ul.employer-list');
              $('ul.employer-list').show();
            }
          });

          if(e.which == 13){
            base.searchMarker();
          }

        }else{
          $('ul.employer-list').hide().html('');
        }
      }).on('blur',function(){
        setTimeout(function(){
          $('ul.employer-list').hide();
        },400);
      });

      $('ul.employer-list').on('click','li',function(){
        $('.search-input').val($(this).text());
        base.searchMarker();
      });

      $('nav a').on('click',function(e){
        e.preventDefault();
        var action = $(this).attr('href').replace('#','');
        switch (action) {
          case 'reset':
            base.reset();
            break;
          case 'export':
            base.export();
            break;
          case 'import':
            base.import();
            break;
          case 'settings':
            base.openLayer('settings');
            break;
          case 'screenshot':
            screenshot({
              url: 'http://sassdoc.com',
              width: 1920,
              height: 1080
            },
            function(err, image){
              // image.data is a Node Buffer 
              // image.size contains width and height 
              // image.devicePixelRatio will contain window.devicePixelRatio 
              console.log('todo: screenshot');              
            });
            break;
        }
      });

      $('a.tool').on('click',function(e){ // context on free space
        e.preventDefault();
        var self = $(this);
        var action = self.attr('href').replace('#','');
        switch(action){
          case 'addPeople':
            var cloned = $('.templates .marker-people').clone(true,true);
            break;
          case 'addKonfi':
            var cloned = $('.templates .marker-konfi').clone(true,true);
            break;
          case 'addSani':
            var cloned = $('.templates .marker-sani').clone(true,true);
            break;
          case 'addCust':
            var cloned = $('.templates .marker-cust').clone(true,true);
            break;
          case 'addDesk':
            var cloned = $('.templates .marker-desk').clone(true,true);
            break;
        }

        cloned.css({
          top: base.contextPos[1] - ($('.templates .marker-konfi').height() / 2),
          left: base.contextPos[0] - ($('.templates .marker-konfi').width() / 2)
        });

        if(action != 'addDesk'){
          dialogs.prompt('infotext','',function(setText){
            if(setText){
              cloned.find('.info').text(setText);
            }
          });
        }
        cloned.appendTo('.marker-holder');
        base.saveMarker();

        $('.tools-context:not(.templates .tools-context)').remove();

      });

      $('a.marker-context-tool').on('click',function(e){
        e.preventDefault();
        var self = $(this);
        var action = self.attr('href').replace('#','');
        switch(action){
          case 'addPic':
            dialog.showOpenDialog({ filters: [
             { name: 'Bilder', extensions: ['png','jpg','jpeg'] }
            ]}, function (fileNames) {
              if(fileNames){
                base.encodeImageBase64(fileNames[0],function(data){
                  if($('.marker-image',base.targetMarker).length == 0){
                    $('.info',base.targetMarker).prepend('<img class="marker-image" src="data:image/png;base64,'+data+'">');
                  }else{
                    $('.marker-image',base.targetMarker).attr('src','data:image/png;base64,'+data);
                  }
                  base.saveMarker();
                });
              }
            });
            break;
          case 'removePic':
            if($('.marker-image',base.targetMarker).length > 0){
              $('.marker-image',base.targetMarker).remove();
            }
            base.saveMarker();
            break;
          case 'edit':
            dialogs.prompt('infotext',$('.info',base.targetMarker).text(),function(setText){
              if(setText){
                $('.info',base.targetMarker).text(setText);
                base.saveMarker();
              }
            });
            break;
          case 'delete':
            var confDel = confirm('Marker "' + ($('.info',base.targetMarker).text()) + '" entfernen?');
            if(confDel){
              base.targetMarker.remove();
              base.saveMarker();
            }
            break;
        }
        $('.marker-context:not(.templates .marker-context)').remove();
      });

      $(document).on('contextmenu',function(e){
        base.targetMarker = {};

        $('.marker-context:not(.templates .marker-context)').remove();
        $('.tools-context:not(.templates .tools-context)').remove();

        if( !($('body').hasClass('locked')) ){
          e.preventDefault();
          base.contextPos = [e.originalEvent.offsetX,e.originalEvent.offsetY];

          if($(e.originalEvent.target).hasClass('marker')){
            var navX = e.originalEvent.clientX;
            var navY = e.originalEvent.clientY;

            var cloned = $('.templates .marker-context').clone(true,true);

            cloned.appendTo('.marker-holder');
            base.targetMarker = $(e.originalEvent.target);

            var contextWidth = cloned.width();
            var contextHeight = cloned.height();

            if(navY + contextHeight > $(window).height()){
              navY = navY - contextHeight;
            }

            if(navX + contextWidth > $(window).width()){
              navX = navX - contextWidth;
            }

            cloned.css({
                top: navY,
                left: navX
            });
          }

          if($(e.originalEvent.target).hasClass('marker-holder')){
            var navX = e.originalEvent.clientX;
            var navY = e.originalEvent.clientY;
            var cloned = $('.templates .tools-context').clone(true,true);

            cloned.appendTo('.marker-holder');

            var contextWidth = cloned.width();
            var contextHeight = cloned.height();

            if(navY + contextHeight > $(window).height()){
              navY = navY - contextHeight;
            }

            if(navX + contextWidth > $(window).width()){
              navX = navX - contextWidth;
            }

            cloned.css({
                top: navY,
                left: navX
            });
          }
        }

      }).on('mousedown',function(e){
        $('.marker.found').removeClass('found');
        if(!($(e.originalEvent.target).parent().hasClass('marker-context'))){
          $('.marker-context:not(.templates .marker-context)').remove();
          base.targetMarker = {};
        }
        if(!($(e.originalEvent.target).parent().hasClass('tools-context'))){
          $('.tools-context:not(.templates .tools-context)').remove();
        }
      }).on('mousedown','.marker',function(md){
        if(md.originalEvent.button == 0 && !($('body').hasClass('locked')) ){
          moveElement = $(this);
          startPosX   = md.originalEvent.pageX;
          startPosY   = md.originalEvent.pageY;
          offsetX     = md.originalEvent.offsetX;
          offsetY     = md.originalEvent.offsetY;
          moveElement.addClass('move');
        }
      }).on('mousemove',function(mm){
        if($('.marker.move').length > 0 && !($('body').hasClass('locked')) ){
          movePosX   = mm.originalEvent.pageX - offsetX;
          movePosY   = mm.originalEvent.pageY - offsetY;
          moveElement.css({
            top: movePosY,
            left: movePosX
          });
        }
      }).on('mouseup',function(mu){
        if($('.marker.move').length > 0 && !($('body').hasClass('locked')) ){
          moveElement.removeClass('move');
          base.saveMarker();
        }
      }).on('keydown',function(kd){
        if(kd.key == 'Shift'){
            $('body').addClass('rotate-mode');
        }
      }).on('keyup',function(ku){
        if(ku.key == 'Shift'){
            $('body').removeClass('rotate-mode');
        }
      }).on('mousewheel',function(e){
        if($('body').hasClass('rotate-mode') && !($('body').hasClass('locked')) ){
          var targetEl = $(e.target);
          var curRot = parseInt(targetEl.attr('data-rotation')),
              newRot = 0,
              rotMulti;

          if(curRot == NaN){
            curRot = 0;
          }

          if(e.altKey){
            rotMulti = 45;
          }else{
            rotMulti = 1;
          }

          if(e.originalEvent.wheelDeltaX < 0){
            newRot = curRot + rotMulti;
          }else{
            newRot = curRot - rotMulti;
          }
          targetEl.attr('data-rotation', newRot);
          $('.marker-desk-graphic',targetEl).css('transform','rotate('+newRot+'deg)');
          base.saveMarker();
        }
      });

      $('button[name="cancel"]').on('click',base.closeLayer);
      $('button[name="save"]').on('click',base.saveSettings);
    },

    searchMarker: function(){
        var searchQuery = $('.search-input').val();
        if(searchQuery != ''){
            $('.marker.found').removeClass('found');
            $('.marker','.marker-holder').each(function(){
                var self = $(this);
                var markerName = $('.info',self).text();
                var sRegExp = new RegExp(searchQuery,'gi');
                if(markerName.match(sRegExp)){
                    self.addClass('found');
                    self.parent().append('<div class="wave" id="wave'+(base.waveID)+'"></div>');
                    $('#wave'+(base.waveID)).css({
                      top: self.position().top,
                      left: self.position().left,
                      width: 1000,
                      height: 1000,
                      borderRadius: 1000,
                      marginTop: -500,
                      marginLeft: -500,
                      opacity: 0
                    });
                    setTimeout(function(){
                      $('#wave'+(base.waveID)).remove();
                    },1000);
                    base.waveID += 1;
                }
            });
        }
    },

    fetchMarker: function(){
      var markers = '';

      $('.marker-holder .marker').each(function(){
        var targetEl    = $(this);
        var targetType  = targetEl.data('type');
        var targetPos   = (targetEl.position().top) + ',' + (targetEl.position().left);
        var targetText  = $('.info',targetEl).text();
        var targetImg   = $('.marker-image',targetEl).attr('src');

        if(targetType == 'marker-desk'){
          var targetText  = targetEl.attr('data-rotation');
        }

        markers += targetType + '|' + targetPos + '|' + targetText + '|' + targetImg + '\n';
      });
      return markers;
    },

    saveMarker: function(){
      setTimeout(function(){
        config.set('db', base.fetchMarker());
      },500);
    },

    loadMarker: function(file){

      if(file){
        loadedDb = file;
      }else{
        if(config.has('db')){
          loadedDb = config.get('db');
        }else{
          loadedDb = false;
        }
      }

      if(loadedDb){
        var getLines = loadedDb.split('\n');

        var countMarker = Object.keys(getLines).length;
        var addedMarker = 1;
        $.each(getLines,function(i,d){
          addedMarker += 1;
          var getElData = d.split('|');
          if(getElData[1] != undefined){
            var markerPos = getElData[1].split(',');
            switch(getElData[0]){
              case 'marker-people':
                var cloned = $('.templates .marker-people').clone(true,true);
                break;
              case 'marker-konfi':
                var cloned = $('.templates .marker-konfi').clone(true,true);
                break;
              case 'marker-sani':
                var cloned = $('.templates .marker-sani').clone(true,true);
                break;
              case 'marker-cust':
                var cloned = $('.templates .marker-cust').clone(true,true);
                break;
              case 'marker-desk':
                var cloned = $('.templates .marker-desk').clone(true,true);
                break;
              default:
                var cloned = false;
                break;
            }

            if(cloned != false){
              var markerText = getElData[2];
              if(getElData[0] != 'marker-desk'){
                cloned.find('.info').text(markerText);
              }else{
                cloned.attr('data-rotation',markerText);
                cloned.find('.marker-desk-graphic').css('transform','rotate('+markerText+'deg)');
              }
              if(getElData[3] != 'undefined' && getElData[3] != undefined){
                cloned.find('.info').prepend('<img class="marker-image" src="'+getElData[3]+'">');
              }
              cloned.css({top:parseInt(markerPos[0]),left:parseInt(markerPos[1])});
              cloned.appendTo('.marker-holder');
            }

            if(addedMarker == countMarker){
              base.saveMarker();
              $('.splashscreen').fadeOut(500);
            }
          }
        });
      }else{
        $('.splashscreen').fadeOut(500);
      }
    },

    reset: function(){
      $('.marker-holder .marker').remove();
    },

    export: function(){
      dialog.showSaveDialog({ filters: [
       { name: 'pflege.de', extensions: ['pflegede'] }
      ]}, function (fileName) {
        if (fileName === undefined){
          base.showMessage("Speichern abgebrochen");
          return;
        }
        // fileName is a string that contains the path and filename created in the save file dialog.
        fs.writeFile(fileName, base.fetchMarker(), function (err) {
          if(err){
            base.showMessage("Speichern fehlgeschlagen<br>"+ err.message);
          }

          base.showMessage("Speichern erfolgreich");
        });
      });
    },

    import: function(){
      dialog.showOpenDialog({ filters: [
       { name: 'pflege.de', extensions: ['pflegede'] }
      ]}, function (fileNames) {
        if(fileNames === undefined){
          base.showMessage("Keine Datei ausgewählt");
        }else{
          fs.readFile(fileNames[0], 'utf-8', function (err, data) {
            if(err){
              base.showMessage("Öffnen fehlgeschlagen<br>" + err.message);
              return;
            }else{
              $('.marker-holder .marker').remove();
              base.loadMarker(data);
            }
          });
        }
      });
    },

    openLayer: function(targetLayer){
      var curScrollPos = $(document).scrollTop();
      $('.layer-'+targetLayer).add('.layer-fog').fadeIn(400);
      $('.layer-'+targetLayer).addClass('open');

      $(document).on('scroll',function(e) {
        $(this).scrollTop(curScrollPos);
      }).on('keydown', function(e){
        if(e.key == 'Escape'){
          base.closeLayer();
        }
      });
    },

    closeLayer: function(){
      $('.layer.open').add('.layer-fog').fadeOut(400);
      $(document).off('scroll');
    },

    saveSettings: function(){
      var appSettings   = {};
      var settingsLayer = $('.layer-settings.open');

      $('input,textarea',settingsLayer).each(function(){
        var self =  $(this),
                    settingName,
                    settingVal;

        settingName = self.attr('name');
        settingType = self.attr('type');

        if(settingType == 'checkbox'){
          settingVal  = self.prop('checked');
        }else if(settingType == 'radio'){
          if(self.is(':checked')){
            settingVal  = self.val();
          }
        }else{
          settingVal  = self.val();
        }
        if(settingVal !== undefined){
          appSettings[settingName] = settingVal;
        }
      }).ready(function(){
        config.set('settings', appSettings);
        base.showMessage("Einstellungen gespeichert");
      });
    },

    loadSettings: function(){
      if(config.has('settings')){
        var settingsObj = config.get('settings');
        var settingsLayer = $('.layer-settings');

        $('input,textarea',settingsLayer).each(function(){
          var self =  $(this);
          var settingName = self.attr('name');

          if(self.attr('type') == 'checkbox'){
            settingVal  = self.prop('checked',settingsObj[settingName]);
          }else if (self.attr('type') == 'radio'){
            if(self.is('[name="'+settingName+'"][value="'+settingsObj[settingName]+'"]')){
              self.prop('checked',true);
            }
          }else{
            settingVal  = self.val(settingsObj[settingName]);
          }
        }).ready(function(){
          // lock/unlock
          if(settingsObj['unlocked-on-start'] == 1){
            $('body').removeClass('locked');
          }
          if(settingsObj['unlocked-on-start'] == 2){
            if(config.has('locked')){
              if(!(config.get('locked'))){
                $('body').removeClass('locked');
              }
            }
          }
        });
      }else{
        base.saveSettings();
      }
    },

    encodeImageBase64: function(file,callback) {
      // read binary data
      var bitmap = fs.readFileSync(file);
      // convert binary data to base64 encoded string
      var callbackData = new Buffer(bitmap).toString('base64');
      callback(callbackData);
    },

    showMessage: function(txt){
      base.messageCount += 1;
      var clone = $('.templates .message-popup').clone(true,true);
      clone.find('.message-content').text(txt);
      clone.attr('id','messageNo' + base.messageCount);
      clone.appendTo('body');
      clone.css('height',clone.find('.message-content').outerHeight());
      setTimeout(function(){
        $('#messageNo' + base.messageCount).height(0);
        setTimeout(function(){
          $('#messageNo' + base.messageCount).remove();
        },300);
      },4000);
    },

    init: function(){
      base.loadSettings();
      base.events();
      base.loadMarker(false);
      $('.splashscreen .version').text('v'+app.getVersion());
    }
  };

  base.init();
});
