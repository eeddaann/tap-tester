let recognizer;
let words;
let wordList;
let modelLoaded = false;


var options = {
    series: [{
    data: [0, 0, 0, 0]
  }],
    chart: {
    type: 'bar',
    height: 350
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: true,
      distributed: true
    }
  },
  dataLabels: {
    enabled: false
  },
  xaxis: {
    categories: ["Background Noise", "good", "talking","bad"],
  },
  yaxis: {
    min: 0,
    max: 1,
  }
  };
var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();


$( document ).ready(function() {
    wordList = ["Background Noise", "talking", "good", "bad"];
    $.each(wordList, function( index, word ) {
        if (!word.startsWith('_')){
            $("#candidate-words").append(`<span class='candidate-word col-md-2 col-sm-3 col-3' id='word-${word}'>${word}</span>`);
        }
    });
});

$("#audio-switch").change(function() {
    if(this.checked){
        if(!modelLoaded){
            loadModel();
        }else{
            startListening();
        }
    }
    else {
        stopListening();
    }   
});

function DrawChart(scores) {
    chart.updateSeries([{
        data: [scores[0].score,scores[2].score,scores[1].score,scores[3].score]
    }]);
}

async function loadModel(){
    $(".progress-bar").removeClass('d-none'); 
    // When calling `create()`, you must provide the type of the audio input.
    // The two available options are `BROWSER_FFT` and `SOFT_FFT`.
    // - BROWSER_FFT uses the browser's native Fourier transform.
    // - SOFT_FFT uses JavaScript implementations of Fourier transform (not implemented yet).
    const URL = 'http://127.0.1:8000/model/';
    const checkpointURL = URL + 'model.json'; // model topology
    const metadataURL = URL + 'metadata.json'; // model metadata
    const recognizer = speechCommands.create(
        'BROWSER_FFT', // fourier transform type, not useful to change
        undefined, // speech commands vocabulary feature, not useful for your models
        checkpointURL,
        metadataURL);
    Promise.all([
        // Make sure that the underlying model and metadata are loaded via HTTPS requests.
        await recognizer.ensureModelLoaded()
      ]).then(function(){
        $(".progress-bar").addClass('d-none');
        words = recognizer.wordLabels();
        $.each(words, function( index, word ) {
            if (!word.startsWith('_') && !wordList.includes(word)){
                $("#candidate-words").append(`<span class='candidate-word' id='word-${word}'>${word}</span>`);
            }
        });
        modelLoaded = true;
        startListening(recognizer);
      })
}

function startListening(recognizer){
    // `listen()` takes two arguments:
    // 1. A callback function that is invoked anytime a word is recognized.
    // 2. A configuration object with adjustable fields such a
    //    - includeSpectrogram
    //    - probabilityThreshold
    //    - includeEmbedding
    recognizer.listen(({scores}) => {
        // scores contains the probability scores that correspond to recognizer.wordLabels().
        // Turn scores into a list of (score,word) pairs.
        scores = Array.from(scores).map((s, i) => ({score: s, word: words[i]}));
        DrawChart(scores)
        // Find the most probable word.
        scores.sort((s1, s2) => s2.score - s1.score);
        $("#word-"+scores[0].word).addClass('candidate-word-active');
        setTimeout(() => {
            $("#word-"+scores[0].word).removeClass('candidate-word-active');
        }, 300);
    }, 
    {
        probabilityThreshold: 0.70
    });
}

function stopListening(){
    recognizer.stopListening();
}