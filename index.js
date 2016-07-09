$(document).ready(function() {
    var midiInput;
    var midiOutput;
    initGUI();
    var chordNames = ['D', 'G/D', 'D', 'A/D', 'D', 'D/F#', 'G', 'D', 'A/D', 'D'];
    function handleMidiIn(t, status, note, vel) {
    	vel/=128;
    	var chordName = chordNames[note % chordNames.length];
    	if(status === 128 || (status === 144 && vel === 0)){
    		stopChord(chordName);
    	}
    	else{
    		playChord(chordName, vel);
    	}
        
    }

    function chordMIDI(chordName){
    	var chord = teoria.chord(chordName);
    	var midi = $.map(chord.notes(), function(note){
    		return note.midi();
    	});
    	return midi;
    }

    function playChord(chordName, vel){
    	var midi = chordMIDI(chordName);
    	midi.forEach(function(note){
    		midiOutput.playNote(note, 1, {velocity: vel});
    	});
    }

    function stopChord(chordName){
    	var midi = chordMIDI(chordName);
    	midi.forEach(function(note){
    		midiOutput.stopNote(note);
    	});
    }


    function webMidiEnable(err) {
        if (err) console.log("An error occurred", err);
        console.log("WebMidi enabled.");
        console.log(WebMidi.inputs);
        console.log(WebMidi.outputs);
        initDropdowns();
    }

    function updateMidiIODropdown(selector, data){
        $(selector).empty();
        $('<option/>', {
                value: "None",
                html: "None selected"
                }).appendTo(selector);
        for(var i=0; i< data.length;i++)
        {
        //creates option tag
          $('<option/>', {
                value: data[i].name,
                html: data[i].name
                }).appendTo(selector); //appends to select if parent div has id dropdown
        }
    }

    function initDropdowns(){
        updateMidiIODropdown('#midiInSelect', WebMidi.inputs);
        updateMidiIODropdown('#midiOutSelect', WebMidi.outputs);
        
        var savedMidiIn = localStorage.getItem('midiInput');
        var savedMidiOut = localStorage.getItem('midiOutput');
        console.log(savedMidiIn);
        console.log(savedMidiOut);

        if(!$.isEmptyObject(savedMidiIn)){
            console.log(savedMidiIn);
            midiInput = WebMidi.getInputByName(savedMidiIn);
            if(!$.isEmptyObject(midiInput)){
                updateMidiInput(savedMidiIn);
                $('#midiInSelect').val(savedMidiIn).trigger('chosen:updated');
            }
        }
        else{
            $('#midiInSelect').val('None').trigger('chosen:updated');
        }

        if(!$.isEmptyObject(savedMidiOut)){
            midiOutput = WebMidi.getOutputByName(savedMidiOut);
            updateMidiOutput(savedMidiOut);
            $('#midiOutSelect').val(savedMidiOut).trigger('chosen:updated');
        }
        else{
            $('#midiOutSelect').val('None').trigger('chosen:updated');
        }
        
        $('#midiInSelect').change(function() {
            updateMidiInput($(this).val());
        });

        $('#midiOutSelect').change(function() {
            updateMidiOutput($(this).val());
        });
    }

    function updateMidiInput(selected){
        localStorage.setItem('midiInput', selected);
        midiInput = WebMidi.getInputByName(selected);
        midiInput.removeListener('noteon');
        midiInput.removeListener('noteoff');
        midiInput.addListener('noteon', 1,
            function (e) {
                var t = e.timestamp;
                var status = e.data[0];
                var note = e.data[1];
                var vel = e.data[2];
                handleMidiIn(t, status, note, vel);
                console.log(e);
        });
        midiInput.addListener('noteoff', 1,
            function (e) {
                var t = e.timestamp;
                var status = e.data[0];
                var note = e.data[1];
                var vel = e.data[2];
                handleMidiIn(t, status, note, vel);
                console.log(e);
        });
    }

    function updateMidiOutput(selected){
        localStorage.setItem('midiOutput', selected);
        midiOutput = WebMidi.getOutputByName(selected);
    }

    function initGUI(){
        WebMidi.enable(webMidiEnable);
    }
});