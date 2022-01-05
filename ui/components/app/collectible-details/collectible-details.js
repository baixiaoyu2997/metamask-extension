import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import Box from '../../ui/box';
import Card from '../../ui/card';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  OVERFLOW_WRAP,
  DISPLAY,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getAssetImageURL,
  isEqualCaseInsensitive,
  shortenAddress,
} from '../../../helpers/utils/util';
import {
  getCurrentChainId,
  getIpfsGateway,
  getRpcPrefsForCurrentProvider,
  getSelectedIdentity,
} from '../../../selectors';
import AssetNavigation from '../../../pages/asset/components/asset-navigation';
import { getCollectibleContracts } from '../../../ducks/metamask/metamask';
import { DEFAULT_ROUTE, SEND_ROUTE } from '../../../helpers/constants/routes';
import {
  checkAndUpdateSingleCollectibleOwnershipStatus,
  removeAndIgnoreCollectible,
} from '../../../store/actions';
import {
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  POLYGON_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../../shared/constants/network';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import CollectibleOptions from '../collectible-options/collectible-options';
import Button from '../../ui/button';
import { ASSET_TYPES, updateSendAsset } from '../../../ducks/send';
import InfoTooltip from '../../ui/info-tooltip';
import { ERC721 } from '../../../helpers/constants/common';

export default function CollectibleDetails({ collectible }) {
  const {
    image,
    name,
    description,
    address,
    tokenId,
    standard,
    isCurrentlyOwned,
  } = collectible;
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const ipfsGateway = useSelector(getIpfsGateway);
  const collectibleContracts = useSelector(getCollectibleContracts);
  const currentNetwork = useSelector(getCurrentChainId);

  const collectibleContractName = collectibleContracts.find(
    ({ address: contractAddress }) =>
      isEqualCaseInsensitive(contractAddress, address),
  )?.name;
  const selectedAccountName = useSelector(
    (state) => getSelectedIdentity(state).name,
  );
  const collectibleImageURL = getAssetImageURL(image, ipfsGateway);

  const onRemove = () => {
    dispatch(removeAndIgnoreCollectible(address, tokenId));
    history.push(DEFAULT_ROUTE);
  };

  useEffect(() => {
    checkAndUpdateSingleCollectibleOwnershipStatus(collectible);
  }, [collectible]);

  const getOpenSeaLink = () => {
    switch (currentNetwork) {
      case MAINNET_CHAIN_ID:
        return `https://opensea.io/assets/${address}/${tokenId}`;
      case POLYGON_CHAIN_ID:
        return `https://opensea.io/assets/matic/${address}/${tokenId}`;
      case GOERLI_CHAIN_ID:
      case KOVAN_CHAIN_ID:
      case ROPSTEN_CHAIN_ID:
      case RINKEBY_CHAIN_ID:
        return `https://testnets.opensea.io/assets/${address}/${tokenId}`;
      default:
        return null;
    }
  };

  const openSeaLink = getOpenSeaLink();
  const sendDisabled = standard !== ERC721;
  const inPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const onSend = async () => {
    await dispatch(
      updateSendAsset({
        type: ASSET_TYPES.COLLECTIBLE,
        details: collectible,
      }),
    );
    history.push(SEND_ROUTE);
  };

  const renderSendButton = () => {
    if (isCurrentlyOwned === false) {
      return <div style={{ height: '30px' }} />;
    }
    return (
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        width={inPopUp ? BLOCK_SIZES.FULL : BLOCK_SIZES.HALF}
      >
        <Button
          type="primary"
          onClick={onSend}
          disabled={sendDisabled}
          className="collectible-details__send-button"
        >
          {t('send')}
        </Button>
        {sendDisabled ? (
          <InfoTooltip position="top" contentText={t('sendingDisabled')} />
        ) : null}
      </Box>
    );
  };

  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={collectibleContractName}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <CollectibleOptions
            onViewOnOpensea={
              openSeaLink
                ? () => global.platform.openTab({ url: openSeaLink })
                : null
            }
            onRemove={onRemove}
          />
        }
      />
      <Box className="collectible-details">
        <div className="collectible-details__top-section">
          <Card
            padding={0}
            justifyContent={JUSTIFY_CONTENT.CENTER}
            className="collectible-details__card"
          >
            <img
              className="collectible-details__image"
              src={collectibleImageURL}
            />
          </Card>
          <Box
            flexDirection={FLEX_DIRECTION.COLUMN}
            className="collectible-details__top-section-info"
            justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
          >
            <div>
              <Typography
                color={COLORS.BLACK}
                variant={TYPOGRAPHY.H4}
                fontWeight={FONT_WEIGHT.BOLD}
                boxProps={{ margin: 0, marginBottom: 3 }}
              >
                {name}
              </Typography>
              <Typography
                color={COLORS.UI3}
                variant={TYPOGRAPHY.H5}
                boxProps={{ margin: 0 }}
                overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
              >
                #{tokenId}
              </Typography>
            </div>
            <div>
              <Typography
                color={COLORS.BLACK}
                variant={TYPOGRAPHY.H6}
                fontWeight={FONT_WEIGHT.BOLD}
                className="collectible-details__description"
                boxProps={{ margin: 0, marginBottom: 2 }}
              >
                {t('description')}
              </Typography>
              <Typography
                color={COLORS.UI4}
                variant={TYPOGRAPHY.H6}
                boxProps={{ margin: 0, marginBottom: 3 }}
              >
                {description}
              </Typography>
            </div>
            {inPopUp ? null : renderSendButton()}
          </Box>
        </div>
        <Box marginBottom={2}>
          <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{
                margin: 0,
                marginBottom: 4,
                marginRight: 2,
              }}
              className="collectible-details__link-title"
            >
              {t('source')}
            </Typography>
            <Typography
              color={COLORS.PRIMARY1}
              variant={TYPOGRAPHY.H6}
              boxProps={{
                margin: 0,
                marginBottom: 4,
              }}
              overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
            >
              <a
                target="_blank"
                href={collectibleImageURL}
                rel="noopener noreferrer"
                className="collectible-details__image-link"
              >
                {image}
              </a>
            </Typography>
          </Box>
          <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{
                margin: 0,
                marginBottom: 4,
                marginRight: 2,
              }}
              className="collectible-details__link-title"
            >
              {t('contractAddress')}
            </Typography>
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H6}
              overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
              boxProps={{
                margin: 0,
                marginBottom: 4,
              }}
            >
              <a
                target="_blank"
                className="collectible-details__contract-link"
                href={getTokenTrackerLink(
                  address,
                  currentNetwork,
                  null,
                  null,
                  rpcPrefs,
                )}
                rel="noopener noreferrer"
              >
                {getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                  ? shortenAddress(address)
                  : address}
              </a>
            </Typography>
          </Box>
          {inPopUp ? renderSendButton() : null}
        </Box>
      </Box>
    </>
  );
}

CollectibleDetails.propTypes = {
  collectible: PropTypes.shape({
    address: PropTypes.string.isRequired,
    tokenId: PropTypes.string.isRequired,
    isCurrentlyOwned: PropTypes.bool,
    name: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    standard: PropTypes.string,
    imageThumbnail: PropTypes.string,
    imagePreview: PropTypes.string,
    creator: PropTypes.shape({
      address: PropTypes.string,
      config: PropTypes.string,
      profile_img_url: PropTypes.string,
    }),
  }),
};
