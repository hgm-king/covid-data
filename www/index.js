import { Dataworker, Chunk } from 'dataworker';
import { memory } from "dataworker/dataworker_bg";

const dataworker = new Dataworker();
console.log(dataworker);

(async () => {
  const t = await Dataworker.fetch("http://localhost:8080/");
  console.log(t);
})();
