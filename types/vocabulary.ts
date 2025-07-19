export interface Choice {
  value: string;
  text: string;
  colorClass: string;
}

export interface Vocabulary {
  bu: string;
  accept: string;
  choices: Choice[];
  howto: string;
  inspector: string;
  picture: string;
  remark: string;
  remarkr: string;
  submit: string;
}