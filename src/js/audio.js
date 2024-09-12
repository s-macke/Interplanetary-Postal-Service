"use strict";

function AudioClass() {
    this.initialized = false;

    this.Init = function () {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.bufferSize = 2 * this.audioContext.sampleRate; // 2 seconds of noise
        this.noiseBuffer = this.audioContext.createBuffer(1, this.bufferSize, this.audioContext.sampleRate);
        this.output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < this.bufferSize; i++) this.output[i] = Math.random() * 2 - 1;
        this.whiteNoise = this.audioContext.createBufferSource();
        this.whiteNoise.buffer = this.noiseBuffer;
        this.whiteNoise.loop = true;
        this.whiteNoise.start(0);

        this.windnodes = [this.CreateNoiseNodes(), this.CreateNoiseNodes(), this.CreateNoiseNodes(), this.CreateNoiseNodes()];
        this.explosion = this.CreateNoiseNodes();
        this.thrust = this.CreateNoiseNodes();
        this.beep = this.CreateNodesforBeep();
        this.initialized = true;
    }

    this.CreateNoiseNodes = function () {
        let biquadFilter = this.audioContext.createBiquadFilter();
        let gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.;
        this.whiteNoise.connect(biquadFilter);
        biquadFilter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        return {gain: gainNode, filter: biquadFilter}
    }

    this.CreateNodesforBeep = function () {
        let osc = this.audioContext.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 500;
        osc.start();
        let gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.;
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        return {gain: gainNode}
    }

    this.Beep = function () {
        if (!this.initialized) return;
        let nodes = this.beep;
        let now = this.audioContext.currentTime;
        nodes.gain.gain.setValueAtTime(0.5, now);
        nodes.gain.gain.setValueAtTime(0., now + 0.2);
    }

    this.filterindex = 0;
    this.SingleWind = function () {
        let nodes = this.windnodes[this.filterindex];
        if (nodes.gain == null) return;
        this.filterindex++;
        if (this.filterindex >= 4) this.filterindex = 0;

        nodes.gain.gain.value = 0.;
        nodes.filter.type = "bandpass";
        nodes.filter.frequency.value = 400. + Math.random() * 300.;
        nodes.filter.Q.value = 10.;

        let attacktime = Math.random() * 5 + 2; // between 2 and 8 seconds
        let releasetime = Math.random() * 3 + 5; // between 5 and 8 seconds

        let now = this.audioContext.currentTime;
        nodes.filter.detune.cancelScheduledValues(now);
        nodes.filter.detune.setValueAtTime(0., now);
        nodes.filter.detune.linearRampToValueAtTime(Math.random() * 200 - 100, now + attacktime + releasetime);

        nodes.gain.gain.cancelScheduledValues(now);
        nodes.gain.gain.setValueAtTime(0., now + 0.01);
        nodes.gain.gain.linearRampToValueAtTime(Math.random() * 0.5 + 0.3, now + attacktime);
        nodes.gain.gain.linearRampToValueAtTime(0., now + attacktime + releasetime);
    }

    this.Wind = function () {
        if (!this.initialized) return;
        this.SingleWind();
        this.SingleWind();
        setInterval(function () {
            this.SingleWind()
        }.bind(this), 5000);
    }

    this.Explosion = function () {
        if (!this.initialized) return;
        let now = this.audioContext.currentTime;
        let nodes = this.explosion;
        if (nodes.gain == null) return;
        nodes.filter.frequency.value = 100.;
        nodes.filter.Q.value = 1.;
        nodes.filter.type = "lowpass";
        nodes.gain.gain.cancelScheduledValues(now);
        nodes.gain.gain.setValueAtTime(20., now);
        nodes.gain.gain.linearRampToValueAtTime(0., now + 3);
    }

    this.ThrustOn = function () {
        if (!this.initialized) return;
        let now = this.audioContext.currentTime;
        let nodes = this.thrust;
        if (nodes.gain == null) return;
        nodes.filter.type = "bandpass";
        nodes.filter.frequency.value = 100.;
        nodes.filter.Q.value = 3.;
        nodes.gain.gain.value = 5.;
    }

    this.ThrustOff = function () {
        if (!this.initialized) return;
        let nodes = this.thrust;
        if (nodes.gain == null) return;
        nodes.gain.gain.value = 0.;
    }

    this.EnableDisable = function () {
        if (!this.initialized) return;
        if (this.audioContext.state === 'running') {
            this.audioContext.suspend().then(function () {
            });
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(function () {
            });
        }
    }


    this.Init();
}

let audio = new AudioClass();