export interface UONETLesson {
  Dzien: number;
  DzienTekst: string;
  NumerLekcji: number;
  IdPoraLekcji: number;
  IdPrzedmiot: number;
  PrzedmiotNazwa: string;
  PodzialSkrot: string;
  Sala: string;
  IdPracownik: number;
  IdPracownikWspomagajacy: number;
  IdPracownikOld: number;
  IdPracownikWspomagajacyOld: number;
  IdPlanLekcji: number;
  AdnotacjaOZmianie: string;
  PrzekreslonaNazwa: boolean;
  PogrubionaNazwa: boolean;
  PlanUcznia: boolean;
}

export interface Lesson {
  date: {
    start: Date;
    end: Date;
  };
  order: number;
  name: string;
  room: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
  note: string;
  isForPupil: boolean;
}
