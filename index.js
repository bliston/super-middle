$(document).ready(function() {
    var midiInput;
    var midiOutput;
    initGUI();
    //var chordNames = ['D', 'G/D', 'D', 'A/D', 'D', 'D/F#', 'G', 'D', 'A/D', 'D']; //amazing grace
    //var chordNames = ['Em', 'G', 'D', 'C', 'Em', 'D', 'Bm', 'C', 'Em', 'D', 'C', 'Em', 'C', 'G', 'D']; //adele hello
    //var chordNames = ['Am', 'F', 'Em', 'Am', 'Am', 'Dm', 'G', 'Am', 'Am', 'F', 'G', 'Am', 'Am', 'Dm', 'Em', 'Am']; //ariana - be alright
    var chords = ['F#m', 'DM7', 'Bm', 'E7', 'AM7', 'DM7', 'AM7', 'DM7', 'G#m7b5', 'C#7b9']; //F#m My Favorite Things
    var melody = ['f#5', 'c#6', 'c#6', 'g#5', 'f#5', 'f#5', 'c#5', 'f#5', 'f#5', 'g#5', 'f#5',
   					'f#5', 'c#6', 'c#6', 'g#5', 'f#5', 'f#5', 'c#5', 'f#5', 'f#5', 'g#5', 'f#5',
   					'f#5', 'c#6', 'b5', 'f#5', 'g#5', 'e5', 'e5', 'b5', 'a5', 'd5',
   					'c#5', 'd5', 'e5', 'f#5', 'g#5', 'a5', 'b5', 'c#6', 'b5', 'e#5'];
   	var melodyIndex = 0;
    function handleMidiIn(t, status, note, vel) {
    	vel/=128;
    	var noteOff = isNoteOff(status, vel); 
    	if(note >= chords.length){ // TREATED AS MELODY
    		if(!noteOff){
    			if(melodyIndex < melody.length){
    				playNote(melody[melodyIndex++], vel);
    			}
	    		else{
	    			melodyIndex = 0;
	    			playNote(melody[melodyIndex++], vel);
	    		}
    		}
    		else{
    			stopNote(melody[melodyIndex > 0 ? melodyIndex - 1 : 0]);
    		}
    	}
    	else{// note < chords.length => TREATED AS A CHORD
	    	var chordName = chords[note];
	    	if(noteOff){
	    		stopChord(chordName);
	    	}
	    	else{
	    		playChord(chordName, vel);
	    	}
    	}
        
    }

    function isNoteOff(status, vel){
    	var result = false;
    	if(status === 128 || (status === 144 && vel === 0)){
    		result = true;
    	}
	    return result;
    }

    function chordMIDI(chordName){
    	var chord = teoria.chord(chordName);
    	var midi = $.map(chord.notes(), function(note){
    		return note.midi();
    	});
    	return midi;
    }

    function noteMIDI(noteName){
    	var note = teoria.note(noteName);
    	return note.midi();
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


    function playNote(noteName, vel){
    	var midi = noteMIDI(noteName);
    	midiOutput.playNote(midi, 1, {velocity: vel});
    }

    function stopNote(noteName){
    	var midi = noteMIDI(noteName);
    	midiOutput.stopNote(midi);
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