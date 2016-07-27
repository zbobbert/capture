contract CaptureOwnerMap {

    struct Offer {
        string imageHash;
        uint value;
    }

   Offer[] offers;

    //Mapping of IPFS Hash to Image Owner Ethereum Address
    mapping(string => address) imageOwners;
    mapping(string => offers) imageOffers;

    // Constructor does not need to do anything yet.
    function CaptureOwnerMap() {

    }

    function addImage(string ipfsHash, address imageOwner) {
        if (imageOwners[ipfsHash] != 0) return;
        imageOwners[ipfsHash] = imageOwner;
    }

    function offerPaymentForImage(string ipfsHash) {
        if (imageOwners[ipfsHash] == 0) return;
        Offer newOffer;
        newOffer.imageHash = ipfsHash;
        newOffer.value = msg.value;
        imageOffers[ipfsHash] += newOffer;
        //imageOwners[ipfsHash].call.gas(200000).value(msg.value)();
    }

    function acceptOffer() {

    }

    function rejectOffer() {

    }
}
