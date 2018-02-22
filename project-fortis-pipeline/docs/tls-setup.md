# TLS setup for Fortis

## Prerequisites

To enable TLS for your Fortis site, you'll need:

1. A domain where you have access to the DNS.
2. A TLS certificate and private key (optional).

## Deployment steps

During the Fortis deployment find the `Endpoint Protection` field in the Fortis
setup wizard. There are three options in the dropdown:

1. `none`: set up a non-secure Fortis site (no https, no login).

2. `tls_provide_certificate`: set up a secure Fortis site using your own TLS
  certificate.

3. `tls_lets_encrypt`: set up a secure Fortis site and have LetsEncrypt generate
  a free TLS certificate.

If you select a value other than `none`, then the `Ingress Hostname` field is
required: this is the hostname that you will use to access services (and
configure TLS for).

### Bring your own TLS certificate

For providing your own certificate, you select `tls_provide_certificate` from
the `Endpoint Protection` drop down and will need:

1. A TLS certificate and private key which need to be `base64` encoded and
  pasted into the Fortis wizard, shown below. Specifically, the `TLS
  Certificate` and `TLS Private Key` fields.

2. Access to your DNS server to point at the newly provisioned end point.
  This hostname you will need is that defined in the `FORTIS_DNS_NAME` tag (see
  below) and it will need to be pointed at the `FORTIS_DNS_IP` address. It
  should be noted that setting up a DNS A record will vary from provider to
  provider.

### LetsEncrypt free certificate

For enabling Let's Encrypt support, you select `tls_lets_encrypt` from the
`Endpoint Protection` dropdown and will need to provide the following:

1. The DNS name for inbound services. This is the `Ingress Hostname` field.

2. An email address that Let's Encrypt can verify the address portion of, for
  instance, if the email is admin@example.com, Let's Encrypt will attempt to
  verify `example.com`. This requires the configuration of either a DNS MX
  record or an A record. How to do this will vary by DNS provider. The value
  that Let's Encrypt will use is exposed in the `FORTIS_MX_RECORD` tag upon
  completion of deployment of Fortis.

3. The Let's Encrypt address to use to request the certificate. Note that,
  the value defaults to the production server for Let's Encrypt. If you are a
  developer, change this value to `https://acme-staging.api.letsencrypt.org/directory`
  to speed up development.

## Post-deployment steps

After your Fortis deployment is finished, you'll have to add an A record and a
MX record (if using LetsEncrypt) for the domain for which you configured TLS.

As an example, if you own the domain `test.com`, have DNS managed via
Cloudflare and you are setting up your Fortis site at `fortis3.test.com`,
ensure that the MX record for `fortis3.test.com` is set to `fortis3.test.com`
and that the A record for `fortis3.test.com` contains the value of the
`FORTIS_DNS_IP` tag that you were shown after your Fortis deployment
finished:

### Cloudflare
![Cloudflare DNS setup](https://user-images.githubusercontent.com/1086421/35749803-c7548c68-0820-11e8-8b5d-e6ab71cb095d.png)

### Namecheap

**Note:** Any record changes may take up to 30 minutes to take effect.

Guide on setting up the [MX record in namecheap](https://www.namecheap.com/support/knowledgebase/article.aspx/322/2237/how-can-i-set-up-mx-records-required-for-mail-service)

![namecheap_a_record](https://user-images.githubusercontent.com/7232635/36557201-9d95ce18-17d5-11e8-9072-f790f378a012.JPG)
![namecheap_mx_record](https://user-images.githubusercontent.com/7232635/36557143-6403a792-17d5-11e8-8cd0-63603add58a2.JPG)