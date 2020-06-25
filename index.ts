import * as  fs from 'fs';
import * as  CsvReadableStream from 'csv-reader';
import * as ora from 'ora';
import * as readline from 'readline-sync';

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });


if (process.argv.length < 3) {
    console.error("ERROR: File name not given.")
    console.log("Sample:")
    console.log("npm run start 'd:\abc.csv'")
}

let file = process.argv[2];
if (!fs.existsSync(file)) {
    console.error(file + " not found.")
    process.exit()
}

let out = file.substr(0, file.length - 4) + " median.csv"

if (fs.existsSync(out)) {
    if (readline.question("Overwrite " + out + "? (Y/n)").toLocaleLowerCase() === 'n')
        process.exit()
    else
        fs.unlinkSync(out)
}

let inputStream = fs.createReadStream(file, 'utf8');
let map = new Map<string, Map<string, number[]>>();

let spinner = ora({ text: 'Loading ' + file, spinner: 'dots', hideCursor: true }).start();

// setTimeout(() => {
//     spinner.color = 'yellow';
//     //spinner.text = 'Loading rainbows';
// }, 1000);

inputStream
    .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true, skipEmptyLines: true }))
    .on('data', function (row) {
        //console.log('A row arrived: ', row);
        //Format
        //['CHART_UPI', 'CATP_DESC', 'PPSF', 'PPP_TMNPC', 'YEAR', 'UTP', 'X', 'Y']
        let [upi, desc, ppsf, tmnpc, year] = row as [string, string, number, string, string]
        if (!map.has(year)) map.set(year, new Map<string, number[]>())

        let m = map.get(year);
        if (!m.has(desc)) m.set(desc, [])

        let a = m.get(desc)
        a.push(ppsf)
    })
    .on('end', function (data) {
        //console.log('No more rows!');
        spinner.stop();

        let s = [] as string[];
        [...map.keys()].forEach(y =>
            [...map.get(y).keys()].forEach(d => {
                let a = map.get(y).get(d).sort();
                let m = a[Math.ceil(a.length / 2)]
                s.push(`"${y}","${d}",${m}`)
            }))

        spinner = ora({ text: 'Writting ' + out, spinner: 'dots', hideCursor: true }).start();

        fs.writeFileSync(out, s.join('\r\n'))

        spinner.stop()
    });

