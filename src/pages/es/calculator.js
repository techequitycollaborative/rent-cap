import React from 'react';
// import { withTranslation } from 'react-i18next';
import { DateRangePicker } from 'react-dates';
import moment from 'moment';
import Disclaimer from '../../components/Disclaimer';
import {
  SuccessButton, DangerButton,
} from '../../components/Buttons';
import { handleInput, calculateTotalAmountOwedToTenant, calculateMaxRent } from '../../methods/helpers';
// import GenerateLetter from '../components/GenerateLetter';
import withRedux from '../../methods/withRedux';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import SEO from '../../components/Seo';
// import MailChimp from '../components/MailChimp'
import '../../styles/calculator.css'
import zipDB from '../../../data/zipDB.js'
import calendar from '../../images/calendar.svg'
import 'bootstrap/dist/css/bootstrap.css';

import { QuickContactForm } from '../../components/Contact';
import AppContext from '../../components/AppContext';
import AutoSubmit from '../../components/AutoSubmit';
import Modal from '../../components/Modal';
import { Link } from "gatsby";


import {
  regulatedCities,
  regulatedCounties
} from "../../../data/regulatedLocations";

const emptyRentRange1 = {
  rent: 0,
  startDate: moment([2019, 2, 15]),
  endDate: moment([2019, 2, 15]),
  focusedInput: null,
  id: 0,
};
const emptyRentRange2 = {
  rent: 0,
  startDate: moment([2020, 0, 1]),
  endDate: moment([2020, 1, 1]),
  focusedInput: null,
  id: 1,
};

const baseCpi2020 = 0.01;
const baseCpi2021 = 0.04;
const baseCpi2022 = 0.077;

const areaToCpi2020 = {
  Rest_Of_California: baseCpi2020,
  'Oakland-Hayward-San_Francisco': 0.011,
  'Los_Angeles-Long_Beach-Anaheim': 0.007,
  'San_Diego-Carlsbad': baseCpi2020,
  'Riverside-San_Bernardino-Ontario': baseCpi2020,
}

const areaToCpi2021 = {
  Rest_Of_California: baseCpi2021,
  'Oakland-Hayward-San_Francisco': 0.038,
  'Los_Angeles-Long_Beach-Anaheim': 0.036,
  'San_Diego-Carlsbad': baseCpi2021,
  'Riverside-San_Bernardino-Ontario': baseCpi2021,
}

const areaToCpi2022 = {
  Rest_Of_California: baseCpi2022,
  'Oakland-Hayward-San_Francisco': 0.05,
  'Los_Angeles-Long_Beach-Anaheim': 0.079,
  'San_Diego-Carlsbad': baseCpi2022,
  'Riverside-San_Bernardino-Ontario': baseCpi2022,
}

// const INITIAL_SELECTION = 'Enter your zip code'

class Calculator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pastRent: undefined,
      currentRent: 0,
      cpi: baseCpi2022,
      showSection: false,
      showLetter: false,
      town: undefined,
      county: undefined,
      // area: INITIAL_SELECTION,
      // showCpiDropdown: false,
      hideMailChimp: true,
      // cpiSelection: INITIAL_SELECTION,
      cpiSelection: undefined,
      rentRanges: [emptyRentRange1, emptyRentRange2],
      zip: "",
      increaseDate: "this-year"
    };
    this.handleInput = handleInput.bind(this);
    this.handlePastRentChange = this.handlePastRentChange.bind(this);
    this.removeRentRange = this.removeRentRange.bind(this);
    this.calculateRentIncreasePercentage = this.calculateRentIncreasePercentage.bind(this);
    this.handleRentRangeValueChange = this.handleRentRangeValueChange.bind(this);
    this.handleRentRangeDateChange = this.handleRentRangeDateChange.bind(this);
    this.handleFocusChange = this.handleFocusChange.bind(this);
    this.setCpiFromZip = this.setCpiFromZip.bind(this);
    this.addRentRange = this.addRentRange.bind(this);
    this.handleIncreaseDateChange = this.handleIncreaseDateChange.bind(this);
  }

  setCpiFromZip(e, updateContext) {
    const input = e.target.value
    const zip = zipDB[input];
    const validCAZip = zip ? true : false;
    var cpi, town, county, cpiSelection, area;

    if (zip) {
      cpi = this.cpiFromZip(zip, this.state.increaseDate);
      town = zip.town;
      county = zip.county;
      area = zip.area;
      cpiSelection = zip.area;
      this.setState({
        cpi, cpiSelection, town, county, zip: input
      })
    }
    updateContext({ zip: input,  validCAZip, county, town, area, cpiSelection });
  }

  cpiFromZip(zip, increaseDate) {
    var cpi;
    if (increaseDate === "this-year") {
      cpi = areaToCpi2022[zip.area];
    }
    else if (increaseDate === "last-year") {
      cpi = areaToCpi2021[zip.area];
    }
    else {
      cpi = areaToCpi2020[zip.area];
    }
    return cpi;
  }

  handleIncreaseDateChange(e) {
    var newIncreaseDate = e.currentTarget.value;

    if (this.state.zip === "") {
      if (newIncreaseDate === "this-year") {
        this.setState({ cpi: baseCpi2022 });
      }
      else if (newIncreaseDate === "last-year") {
        this.setState({ cpi: baseCpi2021 });
      }
      else {
        this.setState({ cpi: baseCpi2020 });
      }
    }
    else {
      this.setState({ cpi: this.cpiFromZip(zipDB[this.state.zip], newIncreaseDate) });
    }
    this.setState({ increaseDate: newIncreaseDate });
  }

  handleRentRangeDateChange(e, idx) {
    const t = this.state.rentRanges.slice(0);
    t[idx].startDate = e.startDate || t[idx].startDate;
    t[idx].endDate = e.endDate || t[idx].endDate;
    // const janFirst2020 = moment([2020, 0, 1])
    // const diff = t[idx].endDate.diff(janFirst2020, 'months', true)
    // t[idx].totalMonthsPaidAfterJan2020 = diff > 0 ? diff : 0
    this.setState(() => ({ rentRanges: t }));
  }

  handleRentRangeValueChange(e, idx, updateContext) {
    const t = this.state.rentRanges.slice(0);
    t[idx].rent = e.target.value;
    if (idx === 0) {
      this.setState({ pastRent: t[idx].rent });
    }
    this.setState({ rentRanges: t });
    const temp = calculateTotalAmountOwedToTenant(t, this.state.cpi, updateContext);
    updateContext({ rentIncrease: temp });
    this.props.changeRefund(temp);
  }

  handlePastRentChange(e, updateContext) {
    this.setState({ pastRent: e.target.value });
    this.handleRentRangeValueChange(e, 0, updateContext);
    updateContext({ pastRent: e.target.valueg })
  }

  removeRentRange(idx) {
    const t = this.state.rentRanges.slice(0);
    if (t.length < 2) return;
    t.splice(idx, 1);
    this.setState({ rentRanges: t });
  }

  calculateRentIncreasePercentage() {
    return parseFloat(((this.state.currentRent - this.state.pastRent) / this.state.pastRent) * 100)
      .toFixed(0);
  }

  handleFocusChange(focusedInput, idx) {
    const t = this.state.rentRanges.slice(0);
    t[idx].focusedInput = focusedInput;
    this.setState({ rentRanges: t });
  }

  addRentRange() {
    const t = this.state.rentRanges.slice(0);
    const r = { ...emptyRentRange2 };
    r.startDate = moment(t[t.length - 1].endDate);
    r.endDate = moment(t[t.length - 1].endDate).add(1, 'months', true);
    r.id = +new Date();
    t.push(r);
    r.rent = 0;
    this.setState(() => ({ rentRanges: t }));
  }

  render() {
    const { t, refund } = this.props;
    const maxRent = calculateMaxRent(this.state.pastRent, this.state.cpi);
    const { rentRanges } = this.state;
    const that = this;
    const rentRangeList = rentRanges.map((rent, idx) => (
      <li className="rent-input-row" key={rent.id}>
        {idx > 1
          && <DangerButton className="remove" onClick={() => that.removeRentRange(idx)}>&times;</DangerButton>}
        {idx === 0
          ? (
            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <span className="input-group-text"><strong>Rent on March 15, 2019</strong></span>
              </div>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text">$</span>
                </div>
                <input type="number" value={this.state.pastRent} className="form-control" placeholder="Rent on March 15, 2019" onChange={(e) => this.handleRentRangeValueChange(e, idx)} />
              </div>
            </div>
          ) : (
            <div className="rent-input">
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text">$</span>
                </div>
                <input type="number" className="form-control" placeholder="Monthly Rent" onChange={(e) => this.handleRentRangeValueChange(e, idx)} />
              </div>
              <div className="rent-date">
                <div className="rent-date-label">
                  <small>From</small>
                  <small>To</small>
                </div>
                <div className="rent-date-picker">
                  <div className="input-group mb-3">
                    <div className="input-group-prepend date-icon">
                      <img className="input-group-text" src={calendar} alt="calendar" />
                    </div>
                    <DateRangePicker
                      endDate={rentRanges[idx].endDate}
                      endDateId="endDate"
                      focusedInput={rentRanges[idx].focusedInput}
                      isOutsideRange={() => null}
                      onDatesChange={(e) => this.handleRentRangeDateChange(e, idx)}
                      onFocusChange={(e) => this.handleFocusChange(e, idx)}
                      startDate={rentRanges[idx].startDate}
                      startDateId="startDate"
                      orientation="vertical"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
      </li>
    ));
    const refundBreakdown = rentRanges.map((range, idx) => {
      // const pastRent = rentRanges[0].rent
      const r = parseFloat(range.rent);
      const start = range.startDate;
      const end = range.endDate;
      const janFirst2020 = moment([2020, 0, 1]);
      const diff = range.endDate.diff(janFirst2020, 'months', true);
      const isAfterJan2020 = diff > 0;
      const monthsPaidAfterJan2020 = isAfterJan2020 ? parseFloat(end.diff(start, 'months', true)).toFixed(2) : 0;
      const val = (r > maxRent) ? (r - maxRent) * monthsPaidAfterJan2020 : 0;
      return (
        <li className={`calc-row${val === 0 ? ' zero' : ''}`}>
          {idx > 0
            && <small>({range.rent} - {maxRent}) * {monthsPaidAfterJan2020} Month{monthsPaidAfterJan2020 === 1 ? '' : 's'} = ${parseFloat(val).toFixed(2)}</small>}
        </li>
      )
    })
    return (
      <AppContext.Consumer>
        {({ appCtx, updateContext }) => (
          <div className="calculator-container">
            {/* <SEO title="Calculator" /> */}
            <div className="calculator-description">
              <h1>Calculadora de Renta</h1>
              <p>
                Los inquilinos elegibles para protección bajo la Ley de Protección
                al Inquilino de 2019 están protegidos contra aumentos de renta
                que exceden el 10% en un período de un año o la inflación + 5%, lo
                que sea menor. Si ha recibido un aumento de renta, puede usar
                nuestra calculadora para ayudarlo a determinar cuál es el aumento
                permitido según la ley, y si su aumento de renta excede el límite.
                Los inquilinos que reúnan los requisitos necesarios y que hayan obtenido
                un aumento del alquiler en los últimos 12 meses deben utilizar la
                calculadora de alquileres, ya que cualquier aumento que supere el límite
                puede revertirse y dar lugar a una reducción del alquiler. <b>Antes de
                usar esta calculadora, verifica tu elegibilidad <Link to="/es/eligibility">aquí</Link></b>!
              </p>
            </div>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">¿Cuál es su código postal?</h5>
                <input className="form-control" type="text" onChange={(e) => this.setCpiFromZip(e, updateContext)} placeholder="Los 5 digitos de su codigo postal (zip code)" />
                {this.state.town
                  && (
                    <small><strong>{this.state.town}</strong>{this.state.county
                      && <strong>, Condado de {this.state.county}</strong>}
                    </small>
                  )}
                {
                  (this.state.town && regulatedCities[this.state.town]) ?
                  <div>
                  <br />
                  <p><strong>DESCARGO DE RESPONSIBILIDAD:</strong> Dado que vive en {this.state.town}, que tiene leyes locales de control de alquileres, es posible que estos cálculos no se apliquen en su caso. Verifique que las leyes locales no le sean aplicables antes de utilizar estos cálculos estatales.</p>
                  </div>
                  :
                  (this.state.county && regulatedCounties[this.state.county]) ?
                  <div>
                  <br />
                  <p><strong>DESCARGO DE RESPONSIBILIDAD:</strong> Dado que vive en el condado no incorporado de {this.state.county}, que tiene leyes locales de control de alquileres, es posible que estos cálculos no se apliquen en su caso. Verifique que las leyes locales no le sean aplicables antes de utilizar estos cálculos estatales.</p>
                  </div>
                  :
                  <div />
                }
                <br />
                <h5 className="card-title">¿Cuándo entró en vigencia su aumento de alquiler?</h5>
                <div className="date-selector">
                  <input type="radio" id="year-before" name="increase-date" value="year-before" onChange={(e) => this.handleIncreaseDateChange(e)} />
                  <label for="year-before">Entre el 1 de agosto de 2020 y el 31 de julio de 2021</label>
                  <input type="radio" id="last-year" name="increase-date" value="last-year" onChange={(e) => this.handleIncreaseDateChange(e)} />
                  <label for="last-year">Entre el 1 de agosto de 2021 y el 31 de julio de 2022</label>
                  <input defaultChecked type="radio" id="this-year" name="increase-date" value="this-year" onChange={(e) => this.handleIncreaseDateChange(e)} />
                  <label for="this-year">Entre el 1 de agosto de 2022 y el 31 de julio de 2023</label>
                </div>
                <br />
                <h5>¿Cuál era su alquiler antes del aumento?</h5>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <span className="input-group-text">$</span>
                  </div>
                  <input
                    type="number"
                    className="form-control"
                    value={this.state.pastRent}
                    placeholder="Monthly Rent"
                    onChange={(e) => this.handlePastRentChange(e, updateContext)}
                  />
                </div>
              </div>
            </div>
            <br />
            <br />
            <ul className="calculator-results">
              <li>
                <h5 className="result-title">Maximo Incremento de Renta</h5>
                {this.state.cpiSelection
                  ? <h3>{parseFloat(Math.min(10, (0.05 + parseFloat(this.state.cpi)) * 100)).toFixed(2)}%</h3>
                  : <h3>-</h3>}
                <small>5% Base + {parseFloat(this.state.cpi * 100).toFixed(2)}% CPI {this.state.cpi > .05 && "(max 10%)"}</small>
                <br />
                <small><strong>{this.state.cpiSelection ? this.state.cpiSelection : ''}</strong></small>
              </li>
              <li>
                <h5 className="result-title">Monto de Renta Permitido</h5>
                {(maxRent > 0 && this.state.cpiSelection)
                  ? <h3>${maxRent}</h3>
                  : <h3>-</h3>}
                <small>Alquiler máximo después del aumento</small>
              </li>
            </ul>
            { maxRent ?
            <AutoSubmit pageName="calculatorAutoSubmit" />
            :
            <div />
            }
            <Disclaimer />
            <br />
            <br />
            {/* {this.state.showSection
          ? (
            <h4>
              Enter your information below to determine how much money
              you may be owed as a rollback.
            </h4>
          ) : (
            <PrimaryButton2 style={{ width: '100%' }} onClick={() => this.setState({ showSection: true })}>
              Did your rent increase on or after January 1st, 2020?
            </PrimaryButton2>
          )} */}
            <br />
            {this.state.showSection
              && (
                <section>
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Ingrese su historial de renta desde el 1 de enero del 2020 hasta ahora.</h5>
                      <section className="rent-increases">
                        <ul>{rentRangeList}</ul>
                        <SuccessButton className="add" onClick={this.addRentRange}>+</SuccessButton>
                      </section>
                    </div>
                  </div>
                  <br />
                  <h4 className="refund-information">
                    Según la información proporcionada, es posible que se le deban
            </h4>
                  <div className="refund-container">
                    <h1>${refund}</h1>
                    {refund > 0
                      && (
                        <ul>
                          {refundBreakdown}
                        </ul>
                      )}
                  </div>
                  <br />
                  {/* <PrimaryButton onClick={() => this.setState({showLetter: true})}>
            Generate a letter to your landlord</PrimaryButton> */}
                </section>
              )}
            {/* {this.state.showLetter
          && <GenerateLetter />} */}
          </div>
        )}
      </AppContext.Consumer>
    );
  }
}

export default withRedux(Calculator);
