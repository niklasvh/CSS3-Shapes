/*
 * @author Niklas von Hertzen <niklas at hertzen.com>
 * @created 7.1.2012
 * @website http://hertzen.com
 */

function CSS3Editor( $ ) {

    var preview = $('#preview'),
    action,
    shapeNum = 1,
    positioning,
    width = preview.width(),
    height = preview.height(),
    startX,
    startY,
    currentEl,
    selectedShape,
    shapeType,
    $previewSelection = $('#preview-selection'),
    $selectionOrigin = $('#selection-origin'),
    prefixes = {},

    $btlx = $('#border-top-left-x'),
    $btly = $('#border-top-left-y'),

    $btrx = $('#border-top-right-x'),
    $btry = $('#border-top-right-y'),

    $bblx = $('#border-bottom-left-x'),
    $bbly = $('#border-bottom-left-y'),

    $bbrx = $('#border-bottom-right-x'),
    $bbry = $('#border-bottom-right-y'),

    $btl = $('#border-position-top-left'),
    $btr = $('#border-position-top-right'),

    $bbl = $('#border-position-bottom-left'),
    $bbr = $('#border-position-bottom-right'),

    $positionX = $('#position-x'),
    $positionY = $('#position-y'),

    $originX = $('#origin-x'),
    $originY = $('#origin-y'),

    $elName = $('#itemclass'),
    $rotation = $('#rotation'),
    $skewX = $('#skew-x'),
    $skewY = $('#skew-y'),

    //  $scaleX = $('#scale-x'),
    //  $scaleY = $('#scale-y'),

    elementWidth,
    elementHeight,

    $adjustable = $('.adjustable'),

    $sizeW = $('#size-w'),
    $sizeH = $('#size-h'),

    $options = $('#element-options'),

    startPos,
    dragging,
    draggingOffset,
    previewOffset,

    $bgcolor = $('#backgroundcolor'),
    $layers = $('#layers'),

    adjustableDragPos,
    adjusting,
    adjustingStartVal;
    /*
    $selectionOrigin.draggable({
        containment: $previewSelection,
        drag: function(event, ui) {
            setOrigin(selectedShape, ui.position.left, ui.position.top );
        }
    });*/

    $layers.sortable({
        update: function(event, ui) {
            var prev = $(ui.item.context).prev(),
            name = $(ui.item.context).text();

            if (prev.length === 0) {
                $("."+name).appendTo(preview);
            } else {
                $("."+name).insertBefore($('.' + $(prev).text()));
            }



        }
    });

    function prefixCheck( prop ) {
        var prefixes = ['','-webkit-','-moz-','-o-','-ms-'],
        len = prefixes.length,
        i;


        for ( i = 0; i < len; i+=1 ) {
            if ( preview.css( prefixes[ i ] + prop ) !== null) {
                return prefixes[ i ] + prop;
            }
        }

    };

    prefixes.transformOrigin = prefixCheck("transform-origin");
    prefixes.transformOriginX = prefixCheck("transform-origin-x");
    prefixes.transformOriginY = prefixCheck("transform-origin-y");
    prefixes.transform = prefixCheck("transform");
    prefixes.borderRadius = prefixCheck("border-radius");

    prefixes.borderTopLeft = prefixCheck("border-top-left-radius");
    prefixes.borderTopRight = prefixCheck("border-top-right-radius");
    prefixes.borderBottomLeft = prefixCheck("border-bottom-left-radius");
    prefixes.borderBottomRight = prefixCheck("border-bottom-right-radius");


    function setOrigin ( el, x, y ) {

        var width = el.width(),
        height = el.height();

        if ( positioning === "percentage" ) {
            $(el).css(prefixes.transformOrigin, ((x / width) * 100) + "% " + ((y / height) * 100) + "%");

            $originX.text( ( rounding( (x / width) * 100) ));
            $originY.text( ( rounding( (y / height) * 100) ));

        } else {
            $(el).css(prefixes.transformOrigin, x + "px " + y + "px");

            $originX.text( x );
            $originY.text( y );
        }
    }

    function setPosition ( el, x, y) {
        if ( positioning === "percentage" ) {
            $(el).css({
                top: ((y / height) * 100) + "%",
                left: ((x / width) * 100) + "%",
            });

            $positionX.text( ( rounding( (x / width) * 100) ) );
            $positionY.text( ( rounding( (y / height) * 100) ));

        } else {
            $(el).css({
                top: y + "px",
                left: x + "px",
            });
            $positionX.text( rounding(x) );
            $positionY.text( rounding(y) );
        }

    }

    function setSize (el, w, h) {
        if ( positioning === "percentage" ) {
            $(el).css({
                width: ((w / width) * 100) + "%",
                height: ((h / height) * 100) + "%",
            });
            $(el).css(prefixes.transformOrigin, (($originX.val() / width) * 100) + "% " + (($originY.val() / height) * 100) + "%");


            $sizeW.text( rounding((w / width) * 100) );
            $sizeH.text( rounding((w / width) * 100) );

        } else {
            $(el).css({
                width: w + "px",
                height: h + "px",
            });
            $(el).css(prefixes.transformOrigin, $originX.val() + "px " + $originY.val() + "px");

            $sizeW.text( rounding(w) );
            $sizeH.text( rounding(h) );
        }
    }

    function changeUnit ( el ) {

        var width = $(el).width(),
        height = $(el).height(),
        offset = $(el).offset(),
        poffset = preview.offset();

        if ( positioning !== "percentage" ) {
            // as it has changed already
            setOrigin(el, (+(($originX.text()) / 100) * width), (+(($originY.text()) / 100) * height));
        } else {
            setOrigin(el, +($originX.text()), +($originY.text()));
        }


        setPosition(el, offset.left - poffset.left, offset.top - poffset.top );
        setSize (el, width, height );
    }

    function rounding(val, decimals) {
        return Math.round(val * 10) / 10;
    }


    function deleteShape ( el )  {

        if ( el === selectedShape ) {
            $previewSelection.insertAfter(preview);
        }

        $layers.find('li:contains('+el.attr('data-name')+')').remove();

        el.remove();
        selectShape();
    }

    function selectShape( el  ){
        var pos,
        parts;

        $('.selected-shape').removeClass('selected-shape');

        selectedShape = el;

        $('#layers li').removeClass('selected-layer primary');

        if (el !== undefined) {
            $options.show();

            $layers.find('li:contains('+el.attr('data-name')+')').addClass('selected-layer primary');


            // bgcolor
            parts = el.css('background-color').match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

            delete (parts[0]);

            for (var i = 1; i <= 3; ++i) {
                parts[i] = parseInt(parts[i]).toString(16);
                if (parts[i].length == 1) parts[i] = '0' + parts[i];
            }
            $bgcolor.val( '#'+parts.join('') );


            $elName.val( el.attr('data-name') );


            selectedShape.addClass('selected-shape');

            pos = selectedShape.css(prefixes.transformOrigin).split(" ");

            $selectionOrigin.css({
                left: pos[0],
                top: pos[1]
            });


            selectedShape.append( $previewSelection );
        /*
            selectedShape.draggable({
                handle: $previewSelection,
                cancel: '.selection-size'
            });*/
        } else {
            $options.hide();
        }
    }

    function setAdjustingVal( val ) {
        adjusting.text( val );

        var unit = "%";

        if (positioning !== "percentage") {
            unit = "px"
        }

        switch(adjusting.attr('id')) {

            case "rotation":
                selectedShape.css(prefixes.transform, 'rotate(' + val + 'deg) skew('+$skewX.text()+'deg,'+$skewY.text()+'deg)');
                break;

            case "skew-x":
                selectedShape.css(prefixes.transform, 'rotate(' + $rotation.text() + 'deg) skew('+val+'deg,'+$skewY.text()+'deg)');
                break;

            case "skew-y":
                selectedShape.css(prefixes.transform, 'rotate(' + $rotation.text() + 'deg) skew('+$skewX.text()+'deg,'+val+'deg)');
                break;


            case "border-top-left-x":
            case "border-top-left-y":

            case "border-top-right-x":
            case "border-top-right-y":

            case "border-bottom-left-x":
            case "border-bottom-left-y":

            case "border-bottom-right-x":
            case "border-bottom-right-y":

                selectedShape.css(prefixes.borderRadius,
                    $btlx.text()+ unit + ' ' +
                    $btrx.text()+ unit + ' ' +
                    $bbrx.text()+ unit + ' ' +
                    $bblx.text()+ unit + '/' +
                    $btly.text()+ unit + ' ' +
                    $btry.text()+ unit + ' ' +
                    $bbry.text()+ unit + ' ' +
                    $bbly.text()+ unit
                    );

                // substr(0,-2) not working????
                switch(adjusting.attr('id').substr(0,adjusting.attr('id').length-2)) {
                    case "border-top-left":
                        $btl.css({
                            top:  $btly.text()+ unit,
                            left: $btlx.text()+ unit
                        });
                        break;

                    case "border-top-right":
                        $btr.css({
                            top:  $btry.text()+ unit,
                            right: $btrx.text()+ unit
                        });
                        break;

                    case "border-bottom-left":
                        $bbl.css({
                            bottom:  $bbly.text()+ unit,
                            left: $bblx.text()+ unit
                        });
                        break;

                    case "border-bottom-right":
                        $bbr.css({
                            bottom:  $bbry.text()+ unit,
                            right: $bbrx.text()+ unit
                        });
                        break;
                }



                break;


            case "position-x":
                selectedShape.css('left', val + unit);
                break;

            case "position-y":
                selectedShape.css('top', val + unit);
                break;

            case "size-w":
                selectedShape.css('width', val + unit);
                break;

            case "size-h":
                selectedShape.css('height', val + unit);
                break;


            case "origin-x":
                $selectionOrigin.css('left', val + unit);
                selectedShape.css(prefixes.transformOriginX, val + unit);
                break;

            case "origin-y":
                $selectionOrigin.css('top', val + unit);
                selectedShape.css(prefixes.transformOriginY, val + unit);
                break;

        }

    }



    $adjustable.bind('mousedown',function(e){
        adjusting = $(this);
        adjustingStartVal = +(adjusting.text());
        adjustableDragPos = e.pageX;
    }).bind('mouseup', function(e){

        if (adjustableDragPos === e.pageX) {
            $(this).attr('contenteditable', true);
        }

        adjusting = undefined;
    }).bind('blur', function() {
        $(this).attr('contenteditable', false);
    }).live('keydown', function(e){

        if (e.keyCode === 13) {
            $(this).blur();
            return false;
        }

    });

    $(document).bind('mousemove' ,function(e){
        if (adjusting !== undefined) {
            setAdjustingVal(rounding(adjustingStartVal + (e.pageX - adjustableDragPos)));
        }

        var left,
        top,
        h,
        w,
        unit = "px",
        pageX = e.pageX,
        pageY = e.pageY;

        if (positioning === "percentage") {
            unit = "%";
        }

        if (dragging !== undefined) {



            switch( dragging.attr('id') ){


                case "selection-size-top":

                    if (positioning === "percentage") {
                        top = ((pageY - previewOffset.top) / height) * 100;
                        h = ((top - (startPos.top - draggingOffset.top  ))  * 100);
                    } else {
                        top = pageY - draggingOffset.top;
                    }
                    
                    
                   
                 

                    selectedShape.css({
                        top: top + unit,
                        height: h + unit
                    });
                    break;

                case "selection-size-bottom":

                    if (positioning === "percentage") {
                        h = ((pageY - draggingOffset.top) / height) * 100;

                    } else {
                        h = pageY - draggingOffset.top;
                    }

                    selectedShape.css({
                        height: h + unit
                    });
                    break;



                case "preview-selection":
                    if (positioning === "percentage") {
                        
                        left = (((pageX - previewOffset.left) - (startPos.left - draggingOffset.left)) / width) * 100;
                        top = (((pageY - previewOffset.top) - (startPos.top - draggingOffset.top)) / height) * 100;

                    } else {
                        left = (pageX - previewOffset.left) - (startPos.left - draggingOffset.left);
                        top = (pageY - previewOffset.top) - (startPos.top - draggingOffset.top);
                    }

                    selectedShape.css({
                        left: left + unit,
                        top: top + unit
                    });

                    $positionX.text(rounding(left));
                    $positionY.text(rounding(top));

                    

                    break;


                case "selection-origin":
                    if (positioning === "percentage") {
                        left = ((pageX - draggingOffset.left) / elementWidth) * 100;
                        top = ((pageY - draggingOffset.top) / elementHeight) * 100;

                    } else {
                        left = pageX - draggingOffset.left;
                        top = pageY - draggingOffset.top;
                    }

                    $selectionOrigin.css({
                        left: left + unit,
                        top: top + unit
                    });

                    $originX.text(rounding(left));
                    $originY.text(rounding(top));

                    selectedShape.css(prefixes.transformOrigin, left + unit + " " + top + unit);

                    break;

                case "border-position-top-left":
                    if (positioning === "percentage") {
                        left = ((pageX - draggingOffset.left) / elementWidth) * 100;
                        top = ((pageY - draggingOffset.top) / elementHeight) * 100;

                    } else {
                        left = pageX - draggingOffset.left;
                        top = pageY - draggingOffset.top;
                    }

                    $btl.css({
                        left: left + unit,
                        top: top + unit
                    });

                    $btlx.text(rounding(left));
                    $btly.text(rounding(top));

                    selectedShape.css(prefixes.borderTopLeft, left + unit + " " + top + unit);

                    break;

                case "border-position-top-right":
                    if (positioning === "percentage") {
                        left = - ((((pageX - (draggingOffset.left)) / elementWidth) * 100) - 100);
                        top = ((pageY - draggingOffset.top) / elementHeight) * 100;

                    } else {
                        left = -(pageX -  draggingOffset.left) + elementWidth;
                        top = pageY - draggingOffset.top;
                    }

                    $btr.css({
                        right: left + unit,
                        top: top + unit
                    });

                    $btrx.text(rounding(left));
                    $btry.text(rounding(top));

                    selectedShape.css(prefixes.borderTopRight, left + unit + " " + top + unit);

                    break;

                case "border-position-bottom-right":
                    if (positioning === "percentage") {
                        left = - ((((pageX - (draggingOffset.left)) / elementWidth) * 100) - 100);
                        top = - ((((pageY - draggingOffset.top) / elementHeight) * 100) - 100);

                    } else {
                        left = -(pageX -  draggingOffset.left) + elementWidth;
                        top = -( pageY - draggingOffset.top) + elementHeight;
                    }

                    $bbr.css({
                        right: left + unit,
                        bottom: top + unit
                    });

                    $bbrx.text(rounding(left));
                    $bbry.text(rounding(top));

                    selectedShape.css(prefixes.borderBottomRight, left + unit + " " + top + unit);

                    break;

                case "border-position-bottom-left":
                    if (positioning === "percentage") {
                        left = ((pageX - draggingOffset.left) / elementWidth) * 100;
                        top = - ((((pageY - draggingOffset.top) / elementHeight) * 100) - 100);

                    } else {
                        left = pageX - draggingOffset.left;
                        top = -( pageY - draggingOffset.top) + elementHeight;
                    }

                    $bbl.css({
                        left: left + unit,
                        bottom: top + unit
                    });

                    $bblx.text(rounding(left));
                    $bbly.text(rounding(top));

                    selectedShape.css(prefixes.borderBottomLeft, left + unit + " " + top + unit);

                    break;

            }
        /*
            dragging.css({
                left: e.pageX - draggingOffset.left,
                top: e.pageY - draggingOffset.top

            });*/
        }

    }).bind('mouseup', function(){
        adjusting = undefined;
        dragging = undefined;
    });




    preview.delegate('.draggable', 'mousedown', function(e) {
        dragging = $(e.target);
        startPos = {
            left:e.pageX,
            top:e.pageY
        };
        elementWidth = selectedShape.width();
        elementHeight = selectedShape.height();
        previewOffset = preview.offset();
        draggingOffset = selectedShape.offset();
    });


    $('#shapes').delegate('a', 'click', function( e ) {
        e.preventDefault();
        preview.css('cursor', 'crosshair');
        shapeType = $(e.target).data('shape');
        action = "createShape";

        $('#tools .btn').removeClass('primary');
        $(this).addClass('primary');


    });


    $('#edit-shape').click(function( e ) {
        e.preventDefault();
        preview.css('cursor', 'pointer');
        action = "editShape";
        $('#tools .btn').removeClass('primary');
        $(this).addClass('primary');
    });

    $('#placeby').change(function(e){
        if (selectedShape !== undefined) {
            positioning = this.value;
            selectedShape.attr('data-positioning',  this.value);
            changeUnit( selectedShape );
        }
        $('#element-options > div').attr('class', 'by' + this.value);

    });



    $bgcolor.bind('change keyup',function() {
        if (selectedShape !== undefined) {
            selectedShape.css('background-color', this.value);
        }
    });

    $elName.change(function(){
        if (selectedShape !== undefined) {
            selectedShape.removeClass(selectedShape.attr('data-name'));
            $layers.find('li:contains('+selectedShape.attr('data-name')+')').text(this.value.trim());
            selectedShape.addClass(this.value.trim());
            selectedShape.attr('data-name', this.value.trim());



        }
    });

    $layers.delegate('li','click',function(){
        selectShape($('.' + $(this).text()));
    });

    $('#preview').mousedown( function(e){
        var $target = $(e.target);

        switch( action ) {
            case  "createShape":
                var previewOffset = preview.offset();

                startX = e.pageX - previewOffset.left;
                startY = e.pageY - previewOffset.top;
                positioning =  $('#placeby').val();




                currentEl = $('<div />')
                .addClass('css3shape shape-' + shapeNum)
                .css({
                    backgroundColor: $bgcolor.val()
                })
                .attr('data-positioning',  positioning)
                .attr('data-name', 'shape-' + shapeNum);

                setPosition( currentEl, startX, startY );
                $('<li />').addClass('btn small').text(currentEl.attr('data-name')).prependTo( $layers );

                $('#preview').append( currentEl  );
                selectShape ( currentEl );

                shapeNum += 1;
                break;

            case "editShape":

                if ($target.hasClass('css3shape')) {

                    selectShape(  $(e.target) );

                /*
                    $selectionOrigin.css({
                        left: selectedShape.
                    }); */
                } else if ( $target.hasClass('border-position') ) {

                } else if ( $target.hasClass('selection-size') ) {

                } else if ( $target.attr('id') === 'preview-selection' ) {

                } else if ( $target.attr('id') === 'selection-origin' ) {

                }else {
                    if (selectedShape !== undefined) {
                        selectShape(  undefined );
                    }

                }

                break;

        }



    } ).mousemove( function( e ){
        if ( currentEl !== undefined ) {
            var previewOffset = preview.offset(),
            w = (e.pageX - startX) - previewOffset.left,
            h = (e.pageY - startY) - previewOffset.top,
            rePosition = false,
            newStartX = startX,
            newStartY = startY;

            if ( w < 0) {
                newStartX = e.pageX - previewOffset.left;
                rePosition = true;
                w = Math.abs( w );
            }
            if (h < 0) {
                newStartY = e.pageY - previewOffset.top;
                rePosition = true;
                h = Math.abs( h );
            }

            if (rePosition) {
                setPosition( currentEl, newStartX, newStartY );
            }


            $selectionOrigin.css({
                left: w / 2,
                top: h / 2
            });




            setSize( currentEl, w, h );

        }




    }).mouseup(function() {
        if (action === "createShape") {
            $('#edit-shape').trigger('click');

            setOrigin(currentEl, currentEl.width()/2, currentEl.height()/2 );

            currentEl = undefined;




        }

    });

    $(document).bind('keydown',function(e){



        switch (e.keyCode) {
            case 46: // del

                if (selectedShape !== undefined) {
                    deleteShape( selectedShape );
                    selectedShape = undefined;
                }


                break;
        }


    })


    selectShape(undefined);

};



CSS3Editor( window.jQuery );

