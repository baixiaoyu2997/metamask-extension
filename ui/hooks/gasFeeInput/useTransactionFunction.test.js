import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';

import {
  CUSTOM_GAS_ESTIMATE,
  EDIT_GAS_MODES,
  GAS_RECOMMENDATIONS,
} from '../../../shared/constants/gas';
import mockState from '../../../test/data/mock-state.json';
import * as Actions from '../../store/actions';
import configureStore from '../../store/store';
import { useGasFeeEstimates } from '../useGasFeeEstimates';
import { FEE_MARKET_ESTIMATE_RETURN_VALUE } from './test-utils';
import { useTransactionFunctions } from './useTransactionFunctions';

jest.mock('../useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));
useGasFeeEstimates.mockImplementation(() => FEE_MARKET_ESTIMATE_RETURN_VALUE);

jest.mock('../../selectors', () => ({
  checkNetworkAndAccountSupports1559: () => true,
}));

const wrapper = ({ children }) => (
  <Provider store={configureStore(mockState)}>{children}</Provider>
);

const renderUseTransactionFunctions = (props) => {
  return renderHook(
    () =>
      useTransactionFunctions({
        defaultEstimateToUse: GAS_RECOMMENDATIONS.MEDIUM,
        editGasMode: EDIT_GAS_MODES.MODIFY_IN_PLACE,
        estimatedBaseFee: '0x59682f10',
        gasFeeEstimates: FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates,
        gasLimit: '21000',
        maxPriorityFeePerGas: '0x59682f10',
        transaction: {
          userFeeLevel: CUSTOM_GAS_ESTIMATE,
          txParams: { maxFeePerGas: '0x5028', maxPriorityFeePerGas: '0x5028' },
        },
        ...props,
      }),
    { wrapper },
  );
};

describe('useMaxPriorityFeePerGasInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should invoke action createCancelTransaction when cancelTransaction callback is invoked', () => {
    const mock = jest
      .spyOn(Actions, 'createCancelTransaction')
      .mockImplementation(() => ({ type: '' }));
    const { result } = renderUseTransactionFunctions();
    result.current.cancelTransaction();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('should invoke action createSpeedUpTransaction when speedUpTransaction callback is invoked', () => {
    const mock = jest
      .spyOn(Actions, 'createSpeedUpTransaction')
      .mockImplementation(() => ({ type: '' }));
    const { result } = renderUseTransactionFunctions();
    result.current.speedUpTransaction();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('should invoke action updateTransaction with 10% increased fee when updateTransactionToMinimumGasFee callback is invoked', () => {
    const mock = jest
      .spyOn(Actions, 'updateTransaction')
      .mockImplementation(() => ({ type: '' }));
    const { result } = renderUseTransactionFunctions();
    result.current.updateTransactionToMinimumGasFee();
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith({
      txParams: {
        estimateSuggested: 'medium',
        estimateUsed: 'minimum',
        gas: '5208',
        gasLimit: '5208',
        maxFeePerGas: '0x582c',
        maxPriorityFeePerGas: '0x582c',
      },
      userFeeLevel: 'minimum',
    });
  });

  it('should invoke action updateTransaction with estimate gas values fee when updateTransactionUsingEstimate callback is invoked', () => {
    const mock = jest
      .spyOn(Actions, 'updateTransaction')
      .mockImplementation(() => ({ type: '' }));
    const { result } = renderUseTransactionFunctions();
    result.current.updateTransactionUsingEstimate(GAS_RECOMMENDATIONS.LOW);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith({
      txParams: {
        estimateSuggested: 'medium',
        estimateUsed: 'low',
        gas: '5208',
        gasLimit: '5208',
        maxFeePerGas: 'c570bd200',
        maxPriorityFeePerGas: 'b2d05e00',
      },
      userFeeLevel: 'low',
    });
  });

  it('should invoke action updateTransaction with dappSuggestedValues values fee when updateTransactionUsingDAPPSuggestedValues callback is invoked', () => {
    const mock = jest
      .spyOn(Actions, 'updateTransaction')
      .mockImplementation(() => ({ type: '' }));
    const { result } = renderUseTransactionFunctions({
      transaction: {
        userFeeLevel: CUSTOM_GAS_ESTIMATE,
        dappSuggestedGasFees: {
          maxFeePerGas: '0x5028',
          maxPriorityFeePerGas: '0x5028',
        },
      },
    });
    result.current.updateTransactionUsingDAPPSuggestedValues();
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith({
      dappSuggestedGasFees: {
        maxFeePerGas: '0x5028',
        maxPriorityFeePerGas: '0x5028',
      },
      txParams: {
        estimateSuggested: 'medium',
        estimateUsed: 'dappSuggested',
        gas: '5208',
        gasLimit: '5208',
        maxFeePerGas: '0x5028',
        maxPriorityFeePerGas: '0x5028',
      },
      userFeeLevel: 'dappSuggested',
    });
  });
});
