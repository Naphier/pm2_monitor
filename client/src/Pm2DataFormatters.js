function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    var val = (bytes / Math.pow(k, i))
    var valStr = val.toFixed(dm)

    return `${valStr}${sizes[i]}`;
}

function formatCpu(percent){
    var lead = ''
    percent = percent.toFixed(1)
    return lead + `${percent}%`
}

function formatUptimeMs(millisec, fixed = 0){
    var seconds = Number(millisec) / 1000
    var d = Math.floor(seconds / (3600*24))
    var w = Math.floor(d / 7)
	var h = Math.floor(seconds % (3600*24) / 3600)
	var m = Math.floor(seconds % 3600 / 60);
    var s = seconds % 60;

    if (w > 0)
        return `${w}w${d.toString().padStart(2, '0')}d`
    else if (d > 0)
        return `${d}d${h.toString().padStart(2, '0')}h`
    else if (h > 0)
        return `${h}h${m.toString().padStart(2, '0')}m`
    else if (Math.floor(m) > 0)
        return `${m}m${Math.floor(s).toString().padStart(2, '0')}s`
    else 
        return s.toFixed(fixed) + "s"
}

function formatRestarts(count, fixed) {
    if (count === 0) return '0';

    const k = 1000;
    
    const sizes = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

    const i = Math.floor(Math.log(count) / Math.log(k));

    var value = count / Math.pow(k, i)
    if (i === 0)
        fixed = 0
    
    return `${value.toFixed(fixed)}${sizes[i]}`;
}

module.exports = {
    formatBytes: formatBytes,
    formatCpu: formatCpu,
    formatRestarts: formatRestarts,
    formatUptimeMs: formatUptimeMs
}